'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Zona = Database['public']['Tables']['zonas']['Row']
type Escuela = Database['public']['Tables']['escuelas']['Row']

export function ZonaDetailPage({ idZona }: { idZona: string }) {
  const [zona, setZona] = useState<Zona | null>(null)
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Escuela>>({})
  const [saving, setSaving] = useState(false)
  const [avancesEscuelas, setAvancesEscuelas] = useState<Record<string, number>>({})
  const [zonas, setZonas] = useState<Zona[]>([])

  useEffect(() => {
    fetchZonaData()
    fetchZonas()
  }, [idZona])

  useEffect(() => {
    if (escuelas.length > 0) {
      calcularAvancesEscuelas().then(setAvancesEscuelas)
    }
  }, [escuelas])

  const calcularAvancesEscuelas = async () => {
    const avances: Record<string, number> = {}
    
    for (const escuela of escuelas) {
      try {
        // Obtener obras de esta escuela
        const { data: obrasData } = await supabase
          .from('obras')
          .select('id_obra')
          .eq('id_escuela', escuela.id_escuela)

        if (!obrasData || obrasData.length === 0) {
          avances[escuela.id_escuela] = 0
          continue
        }

        // Obtener tareas de todas las obras de esta escuela
        const { data: tareasData } = await supabase
          .from('tareas')
          .select('id_obra, avance')
          .in('id_obra', obrasData.map(o => o.id_obra))

        if (!tareasData || tareasData.length === 0) {
          avances[escuela.id_escuela] = 0
          continue
        }

        // Calcular avance por obra
        const avancePorObra: Record<string, number[]> = {}
        tareasData.forEach(tarea => {
          if (!avancePorObra[tarea.id_obra]) {
            avancePorObra[tarea.id_obra] = []
          }
          avancePorObra[tarea.id_obra].push(tarea.avance || 0)
        })

        // Calcular promedio por obra y luego promedio general
        const avancesObras = Object.values(avancePorObra).map(tareasObra => 
          tareasObra.length > 0 ? tareasObra.reduce((a, b) => a + b, 0) / tareasObra.length : 0
        )

        avances[escuela.id_escuela] = avancesObras.length > 0 ? Math.round(avancesObras.reduce((a, b) => a + b, 0) / avancesObras.length) : 0
      } catch (err) {
        console.error(`Error calculando avance de escuela ${escuela.id_escuela}:`, err)
        avances[escuela.id_escuela] = 0
      }
    }
    
    return avances
  }

  async function fetchZonaData() {
    try {
      const [zonaRes, escuelasRes] = await Promise.all([
        supabase.from('zonas').select('*').eq('id_zona', idZona).single(),
        supabase
          .from('escuelas')
          .select('*')
          .eq('id_zona', idZona)
          .order('nombre')
      ])

      if (zonaRes.error) throw zonaRes.error
      if (escuelasRes.error) throw escuelasRes.error

      setZona(zonaRes.data)
      setEscuelas(escuelasRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  async function fetchZonas() {
    try {
      const { data } = await supabase
        .from('zonas')
        .select('*')
        .order('nombre')
      setZonas(data || [])
    } catch (err) {
      console.error('Error al cargar zonas:', err)
    }
  }

  const filteredEscuelas = escuelas.filter(escuela =>
    escuela.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    escuela.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setEditForm({ 
      nombre: '',
      direccion: '',
      id_zona: idZona
    })
    setEditMode(true)
  }

  const handleEdit = (escuela: Escuela) => {
    setEditForm(escuela)
    setEditMode(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (editForm.id_escuela) {
        // Actualizar
        const { error } = await supabase
          .from('escuelas')
          .update({
            nombre: editForm.nombre,
            direccion: editForm.direccion,
            id_zona: editForm.id_zona
          })
          .eq('id_escuela', editForm.id_escuela)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('escuelas')
          .insert({
            nombre: editForm.nombre,
            direccion: editForm.direccion,
            id_zona: editForm.id_zona || idZona
          })

        if (error) throw error
      }

      setEditMode(false)
      await fetchZonaData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar escuela')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta escuela? Esta acción no se puede deshacer.')) return
    
    try {
      const { error } = await supabase
        .from('escuelas')
        .delete()
        .eq('id_escuela', id)

      if (error) throw error
      await fetchZonaData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar escuela')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditForm({})
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!zona) return <div className="p-8">Zona no encontrada</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <a
                  href="/zonas"
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </a>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{zona.nombre}</h1>
                  <p className="text-gray-600">Escuelas de esta zona</p>
                </div>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Inicio
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        {/* Barra de búsqueda y acciones */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar escuelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Escuela
            </button>
          </div>
        </div>

        {/* Formulario de edición */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editForm.id_escuela ? 'Editar Escuela' : 'Nueva Escuela'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la escuela *</label>
                <input
                  type="text"
                  value={editForm.nombre || ''}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={editForm.direccion || ''}
                  onChange={(e) => setEditForm({...editForm, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona *</label>
                <select
                  value={editForm.id_zona || idZona}
                  onChange={(e) => setEditForm({...editForm, id_zona: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {zonas.map((zonaOption) => (
                    <option key={zonaOption.id_zona} value={zonaOption.id_zona}>
                      {zonaOption.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.nombre || !editForm.id_zona}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de escuelas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Escuelas {searchTerm && `(filtrando: ${filteredEscuelas.length} de ${escuelas.length})`}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-lg">
                  <span className="text-gray-700 font-semibold">Avance de la zona: </span>
                  <span className="text-2xl font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-lg">
                    {escuelas.length > 0 ? Math.round(Object.values(avancesEscuelas).reduce((a, b) => a + b, 0) / Object.values(avancesEscuelas).length) : 0}%
                  </span>
                </div>
                <div className="w-48 bg-gray-200 rounded-full h-4 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${escuelas.length > 0 ? Math.round(Object.values(avancesEscuelas).reduce((a, b) => a + b, 0) / Object.values(avancesEscuelas).length) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredEscuelas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No se encontraron escuelas que coincidan con la búsqueda' : 'No hay escuelas registradas en esta zona'}
              </div>
            ) : (
              filteredEscuelas.map((escuela) => (
                <div key={escuela.id_escuela} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{escuela.nombre}</h3>
                        {escuela.direccion && (
                          <p className="text-sm text-gray-600">{escuela.direccion}</p>
                        )}
                        {avancesEscuelas[escuela.id_escuela] !== undefined && avancesEscuelas[escuela.id_escuela] > 0 && (
                          <div className="flex items-center space-x-3 mt-3">
                            <span className="text-base font-semibold text-gray-700">Avance:</span>
                            <div className="flex-1 max-w-sm bg-gray-200 rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${avancesEscuelas[escuela.id_escuela]}%` }}
                              ></div>
                            </div>
                            <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{avancesEscuelas[escuela.id_escuela]}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <a
                        href={`/escuelas/${escuela.id_escuela}`}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        title="Ver obras"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Ver obras</span>
                      </a>
                      <button
                        onClick={() => handleEdit(escuela)}
                        className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                        title="Editar"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(escuela.id_escuela)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
