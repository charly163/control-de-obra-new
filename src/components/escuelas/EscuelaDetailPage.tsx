'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Escuela = Database['public']['Tables']['escuelas']['Row']
type Obra = Database['public']['Tables']['obras']['Row'] & {
  escuelas: Pick<Escuela, 'nombre'>
}

export function EscuelaDetailPage({ idEscuela }: { idEscuela: string }) {
  const [escuela, setEscuela] = useState<Escuela | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Obra>>({})
  const [saving, setSaving] = useState(false)
  const [empresas, setEmpresas] = useState<Database['public']['Tables']['empresas']['Row'][]>([])

  useEffect(() => {
    fetchEscuelaData()
    fetchEmpresas()
  }, [idEscuela])

  async function fetchEmpresas() {
    try {
      const { data } = await supabase
        .from('empresas')
        .select('*')
        .order('nombre')
      setEmpresas(data || [])
    } catch (err) {
      console.error('Error al cargar empresas:', err)
    }
  }

  async function fetchEscuelaData() {
    try {
      const [escuelaRes, obrasRes] = await Promise.all([
        supabase.from('escuelas').select('*').eq('id_escuela', idEscuela).single(),
        supabase
          .from('obras')
          .select(`
            *,
            escuelas:escuelas(nombre)
          `)
          .eq('id_escuela', idEscuela)
          .order('fecha_inicio_prevista', { ascending: false })
      ])

      if (escuelaRes.error) throw escuelaRes.error
      if (obrasRes.error) throw obrasRes.error

      setEscuela(escuelaRes.data)
      setObras(obrasRes.data || [])
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
    obra.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular avance total de la escuela
  const calcularAvanceEscuela = async () => {
    if (obras.length === 0) return 0
    
    try {
      // Filtrar obras que tienen id_obra válido
      const obrasConId = obras.filter(obra => obra.id_obra)
      
      if (obrasConId.length === 0) return 0
      
      const { data: tareasData } = await supabase
        .from('tareas')
        .select('id_obra, avance')
        .in('id_obra', obrasConId.map(o => o.id_obra!))

      if (!tareasData) return 0

      // Calcular avance por obra
      const avancePorObra: Record<string, number[]> = {}
      tareasData.forEach(tarea => {
        if (tarea.id_obra) {
          if (!avancePorObra[tarea.id_obra]) {
            avancePorObra[tarea.id_obra] = []
          }
          avancePorObra[tarea.id_obra]!.push(tarea.avance || 0)
        }
      })

      // Calcular promedio por obra y luego promedio general
      const avancesObras = Object.values(avancePorObra).map(tareasObra => 
        tareasObra.length > 0 ? tareasObra.reduce((a: number, b: number) => a + b, 0) / tareasObra.length : 0
      )

      return avancesObras.length > 0 ? Math.round(avancesObras.reduce((a: number, b: number) => a + b, 0) / avancesObras.length) : 0
    } catch (err) {
      console.error('Error calculando avance de escuela:', err)
      return 0
    }
  }

  const [avanceEscuela, setAvanceEscuela] = useState(0)
  const [avancesObras, setAvancesObras] = useState<Record<string, number>>({})

  useEffect(() => {
    if (obras.length > 0) {
      calcularAvanceEscuela().then(setAvanceEscuela)
      calcularAvancesObras().then(setAvancesObras)
    }
  }, [obras])

  const calcularAvancesObras = async () => {
    const avances: Record<string, number> = {}
    
    for (const obra of obras) {
      if (!obra.id_obra) continue // Saltar si id_obra es null
      
      try {
        const { data: tareasData } = await supabase
          .from('tareas')
          .select('avance')
          .eq('id_obra', obra.id_obra)

        if (tareasData && tareasData.length > 0) {
          const promedio = tareasData.reduce((acc, tarea) => acc + (tarea.avance || 0), 0) / tareasData.length
          avances[obra.id_obra] = Math.round(promedio)
        } else {
          avances[obra.id_obra] = 0
        }
      } catch (err) {
        console.error(`Error calculando avance de obra ${obra.id_obra}:`, err)
        avances[obra.id_obra] = 0
      }
    }
    
    return avances
  }

  const handleCreate = () => {
    setEditForm({ 
      nombre: '',
      numero_obra: '',
      nro_de_expte: '',
      estado: 'planificada',
      id_escuela: idEscuela,
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
      
      // Validar que los campos requeridos estén presentes
      if (!editForm.nombre?.trim()) {
        throw new Error('El nombre de la obra es requerido')
      }
      
      if (!editForm.id_escuela && !idEscuela) {
        throw new Error('La escuela es requerida')
      }
      
      const obraData = {
        nombre: editForm.nombre?.trim() || null,
        numero_obra: editForm.numero_obra?.trim() || null,
        nro_de_expte: editForm.nro_de_expte?.trim() || null,
        estado: editForm.estado || 'planificada',
        // Solo enviar id_escuela si tiene valor
        id_escuela: editForm.id_escuela || idEscuela || null,
        // Convertir fechas a formato ISO o null si están vacías
        fecha_inicio_prevista: editForm.fecha_inicio_prevista ? new Date(editForm.fecha_inicio_prevista).toISOString() : null,
        fecha_fin_prevista: editForm.fecha_fin_prevista ? new Date(editForm.fecha_fin_prevista).toISOString() : null,
        fecha_inicio_real: editForm.fecha_inicio_real ? new Date(editForm.fecha_inicio_real).toISOString() : null,
        fecha_fin_real: editForm.fecha_fin_real ? new Date(editForm.fecha_fin_real).toISOString() : null
      }
      
      console.log('Datos a guardar:', obraData)
      console.log('idEscuela (parámetro):', idEscuela)
      console.log('editForm.id_escuela:', editForm.id_escuela)
      
      if (editForm.id_obra) {
        // Actualizar
        console.log('Actualizando obra con ID:', editForm.id_obra)
        const { error } = await supabase
          .from('obras')
          .update(obraData)
          .eq('id_obra', editForm.id_obra)

        if (error) {
          console.error('Error al actualizar obra:', error)
          console.error('Detalles del error:', JSON.stringify(error, null, 2))
          console.error('Código de error:', error.code)
          console.error('Mensaje de error:', error.message)
          console.error('Detalles:', error.details)
          throw error
        }
      } else {
        // Crear
        console.log('Creando nueva obra')
        const { error } = await supabase
          .from('obras')
          .insert(obraData)

        if (error) {
          console.error('Error al crear obra:', error)
          console.error('Detalles del error:', JSON.stringify(error, null, 2))
          console.error('Código de error:', error.code)
          console.error('Mensaje de error:', error.message)
          console.error('Detalles:', error.details)
          throw error
        }
      }

      setEditMode(false)
      await fetchEscuelaData()
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
      await fetchEscuelaData()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <a
                  href="/zonas"
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </a>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{escuela?.nombre}</h1>
              </div>
              {escuela?.direccion && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {escuela.direccion}
                </div>
              )}
            </div>
            <div>
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
                  placeholder="Buscar obras por nombre, número, expediente o estado..."
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.nombre}
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
              <div className="flex items-center space-x-4">
                <div className="text-lg">
                  <span className="text-gray-700 font-semibold">Avance de la escuela: </span>
                  <span className="text-2xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg">{avanceEscuela}%</span>
                </div>
                <div className="w-48 bg-gray-200 rounded-full h-4 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${avanceEscuela}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredObras.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No se encontraron obras que coincidan con la búsqueda' : 'No hay obras registradas en esta escuela'}
              </div>
            ) : (
              filteredObras.map((obra) => (
                <div key={obra.id_obra} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{obra.nombre || 'Sin nombre'}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                          {obra.numero_obra && <span>N°: {obra.numero_obra}</span>}
                          {obra.nro_de_expte && <span>Exp: {obra.nro_de_expte}</span>}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado || 'planificada')}`}>
                            {obra.estado || 'planificada'}
                          </span>
                        </div>
                        {obra.id_obra && avancesObras[obra.id_obra] !== undefined && avancesObras[obra.id_obra] > 0 && (
                          <div className="flex items-center space-x-3 mt-3">
                            <span className="text-base font-semibold text-gray-700">Avance:</span>
                            <div className="flex-1 max-w-sm bg-gray-200 rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${avancesObras[obra.id_obra]}%` }}
                              ></div>
                            </div>
                            <span className="text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{avancesObras[obra.id_obra]}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <a
                        href={`/obras/${obra.id_obra}/tareas`}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        title="Gestionar tareas"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Tareas</span>
                      </a>
                      <a
                        href={`/obras/${obra.id_obra}`}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Detalles</span>
                      </a>
                      <button
                        onClick={() => handleEdit(obra)}
                        className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                        title="Editar"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => obra.id_obra && handleDelete(obra.id_obra)}
                        disabled={!obra.id_obra}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
