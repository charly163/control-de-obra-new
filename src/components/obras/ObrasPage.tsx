'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Obra = Database['public']['Tables']['obras']['Row'] & {
  escuelas: Pick<Database['public']['Tables']['escuelas']['Row'], 'nombre'> & {
    zonas: Pick<Database['public']['Tables']['zonas']['Row'], 'nombre'>
  }
}

export function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Obra>>({})
  const [saving, setSaving] = useState(false)
  const [escuelas, setEscuelas] = useState<Database['public']['Tables']['escuelas']['Row'][]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [obrasRes, escuelasRes] = await Promise.all([
        supabase
          .from('obras')
          .select(`
            *,
            escuelas:escuelas(
              nombre,
              zonas:zonas(nombre)
            )
          `)
          .order('nombre'),
        supabase
          .from('escuelas')
          .select('*')
          .order('nombre')
      ])

      if (obrasRes.error) throw obrasRes.error
      if (escuelasRes.error) throw escuelasRes.error

      setObras(obrasRes.data || [])
      setEscuelas(escuelasRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const filteredObras = obras.filter(obra =>
    obra.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.numero_obra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.nro_de_expte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.escuelas?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.escuelas?.zonas?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setEditForm({
      nombre: '',
      numero_obra: '',
      nro_de_expte: '',
      estado: 'planificada',
      id_escuela: '',
      fecha_inicio_prevista: '',
      fecha_fin_prevista: '',
      fecha_inicio_real: '',
      fecha_fin_real: ''
    })
    setEditMode(true)
  }

  const handleEdit = (obra: Obra) => {
    setEditForm(obra)
    setEditMode(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (editForm.id_obra) {
        // Actualizar
        const { error } = await supabase
          .from('obras')
          .update({
            nombre: editForm.nombre,
            numero_obra: editForm.numero_obra,
            nro_de_expte: editForm.nro_de_expte,
            estado: editForm.estado,
            id_escuela: editForm.id_escuela,
            fecha_inicio_prevista: editForm.fecha_inicio_prevista || null,
            fecha_fin_prevista: editForm.fecha_fin_prevista || null,
            fecha_inicio_real: editForm.fecha_inicio_real || null,
            fecha_fin_real: editForm.fecha_fin_real || null
          })
          .eq('id_obra', editForm.id_obra)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('obras')
          .insert({
            nombre: editForm.nombre,
            numero_obra: editForm.numero_obra,
            nro_de_expte: editForm.nro_de_expte,
            estado: editForm.estado || 'planificada',
            id_escuela: editForm.id_escuela,
            fecha_inicio_prevista: editForm.fecha_inicio_prevista || null,
            fecha_fin_prevista: editForm.fecha_fin_prevista || null,
            fecha_inicio_real: editForm.fecha_inicio_real || null,
            fecha_fin_real: editForm.fecha_fin_real || null
          })

        if (error) throw error
      }

      setEditMode(false)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar obra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta obra? Esta acción no se puede deshacer.')) return
    
    try {
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id_obra', id)

      if (error) throw error
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar obra')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditForm({})
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'en_progreso': return 'bg-blue-100 text-blue-800'
      case 'finalizada': return 'bg-green-100 text-green-800'
      case 'planificada': return 'bg-yellow-100 text-yellow-800'
      case 'suspendida': return 'bg-red-100 text-red-800'
      case 'pausada': return 'bg-orange-100 text-orange-800'
      case 'cancelada': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando obras...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <a
                  href="/escuelas"
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </a>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Obras</h1>
              </div>
              <p className="text-gray-600">Administración de obras del sistema</p>
            </div>
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
                  placeholder="Buscar por nombre, número, expediente, escuela o zona..."
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
              Nueva Obra
            </button>
          </div>
        </div>

        {/* Formulario de edición */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editForm.id_obra ? 'Editar Obra' : 'Nueva Obra'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la obra *</label>
                <input
                  type="text"
                  value={editForm.nombre || ''}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de obra</label>
                <input
                  type="text"
                  value={editForm.numero_obra || ''}
                  onChange={(e) => setEditForm({...editForm, numero_obra: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">N° de expediente</label>
                <input
                  type="text"
                  value={editForm.nro_de_expte || ''}
                  onChange={(e) => setEditForm({...editForm, nro_de_expte: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1234/2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Escuela *</label>
                <select
                  value={editForm.id_escuela || ''}
                  onChange={(e) => setEditForm({...editForm, id_escuela: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar escuela...</option>
                  {escuelas.map((escuela) => (
                    <option key={escuela.id_escuela} value={escuela.id_escuela}>
                      {escuela.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={editForm.estado || 'planificada'}
                  onChange={(e) => setEditForm({...editForm, estado: e.target.value as 'planificada' | 'en_progreso' | 'finalizada' | 'suspendida' | 'pausada' | 'cancelada'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planificada">Planificada</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="finalizada">Finalizada</option>
                  <option value="suspendida">Suspendida</option>
                  <option value="pausada">Pausada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha inicio prevista</label>
                <input
                  type="date"
                  value={editForm.fecha_inicio_prevista || ''}
                  onChange={(e) => setEditForm({...editForm, fecha_inicio_prevista: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha fin prevista</label>
                <input
                  type="date"
                  value={editForm.fecha_fin_prevista || ''}
                  onChange={(e) => setEditForm({...editForm, fecha_fin_prevista: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha inicio real</label>
                <input
                  type="date"
                  value={editForm.fecha_inicio_real || ''}
                  onChange={(e) => setEditForm({...editForm, fecha_inicio_real: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha fin real</label>
                <input
                  type="date"
                  value={editForm.fecha_fin_real || ''}
                  onChange={(e) => setEditForm({...editForm, fecha_fin_real: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.nombre || !editForm.id_escuela}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de obras */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Obras {searchTerm && `(filtrando: ${filteredObras.length} de ${obras.length})`}
              </h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredObras.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No se encontraron obras que coincidan con la búsqueda' : 'No hay obras registradas'}
              </div>
            ) : (
              filteredObras.map((obra) => (
                <div key={obra.id_obra} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{obra.nombre || 'Sin nombre'}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                          {obra.estado}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {obra.numero_obra && <span>N°: {obra.numero_obra}</span>}
                        {obra.nro_de_expte && <span>Exp: {obra.nro_de_expte}</span>}
                        {obra.escuelas && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{obra.escuelas.nombre}</span>
                            {obra.escuelas.zonas && (
                              <span className="text-gray-500">({obra.escuelas.zonas.nombre})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <a
                        href={`/obras/${obra.id_obra}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleEdit(obra)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => obra.id_obra && handleDelete(obra.id_obra)}
                        disabled={!obra.id_obra}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
