'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Obra = Database['public']['Tables']['obras']['Row'] & {
  escuelas: Pick<Database['public']['Tables']['escuelas']['Row'], 'nombre' | 'id_zona'> & {
    zonas: Pick<Database['public']['Tables']['zonas']['Row'], 'nombre'>
  }
}
type Tarea = Database['public']['Tables']['tareas']['Row'] & {
  rubros: Pick<Database['public']['Tables']['rubros']['Row'], 'nombre'>
  empresas: Pick<Database['public']['Tables']['empresas']['Row'], 'nombre' | 'cuit' | 'telefono'>
}

export function ObraDetailPage({ idObra }: { idObra: string }) {
  console.log('Componente ObraDetailPage montado con idObra:', idObra)
  
  const [obra, setObra] = useState<Obra | null>(null)
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Obra>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    console.log('useEffect ejecutado')
    fetchObraData()
  }, [idObra])

  async function fetchObraData() {
    try {
      console.log('Iniciando fetchObraData con idObra:', idObra)
      setLoading(true)
      
      // Cargar la obra con escuela y zona
      console.log('Cargando obra con relaciones...')
      const obraRes = await supabase
        .from('obras')
        .select(`
          *,
          escuelas:escuelas(
            *,
            zonas:zonas(nombre)
          )
        `)
        .eq('id_obra', idObra)
        .single()

      console.log('Respuesta obra:', obraRes)

      if (obraRes.error) {
        console.error('Error en obra con relaciones:', obraRes.error)
        throw obraRes.error
      }

      // Cargar tareas por separado para evitar errores complejos
      console.log('Cargando tareas...')
      const tareasRes = await supabase
        .from('tareas')
        .select('*')
        .eq('id_obra', idObra)
        .order('nombre')

      console.log('Respuesta tareas:', tareasRes)

      if (tareasRes.error) {
        console.error('Error en tareas:', tareasRes.error)
        throw tareasRes.error
      }

      const tareasConRelaciones = (tareasRes.data || []).map(tarea => ({
        ...tarea,
        rubros: { nombre: 'Sin rubro' },
        empresas: null
      }))

      setObra(obraRes.data)
      setTareas(tareasConRelaciones)
      console.log('Datos cargados exitosamente')
    } catch (err) {
      console.error('Error completo:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
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

  const getTareaEstadoColor = (estado: string) => {
    switch (estado) {
      case 'en_progreso': return 'bg-blue-100 text-blue-800'
      case 'completada': return 'bg-green-100 text-green-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'bloqueada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEdit = () => {
    setEditForm({
      nombre: obra?.nombre || '',
      numero_obra: obra?.numero_obra || '',
      nro_de_expte: obra?.nro_de_expte || '',
      estado: obra?.estado || 'planificada',
      fecha_inicio_prevista: obra?.fecha_inicio_prevista || '',
      fecha_fin_prevista: obra?.fecha_fin_prevista || '',
      fecha_inicio_real: obra?.fecha_inicio_real || '',
      fecha_fin_real: obra?.fecha_fin_real || ''
    })
    setEditMode(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Guardando obra con datos:', editForm)
      
      const updateData: any = {
        nombre: editForm.nombre,
        numero_obra: editForm.numero_obra,
        nro_de_expte: editForm.nro_de_expte,
        estado: editForm.estado,
        fecha_inicio_prevista: editForm.fecha_inicio_prevista || null,
        fecha_fin_prevista: editForm.fecha_fin_prevista || null,
        fecha_inicio_real: editForm.fecha_inicio_real || null,
        fecha_fin_real: editForm.fecha_fin_real || null
      }
      
      console.log('Datos a actualizar:', updateData)
      
      const { data, error } = await supabase
        .from('obras')
        .update(updateData)
        .eq('id_obra', idObra)
        .select()
        .single()

      console.log('Respuesta de actualización:', { data, error })

      if (error) {
        console.error('Error específico de Supabase:', error)
        console.error('Detalles del error:', JSON.stringify(error, null, 2))
        console.error('Mensaje de error:', error.message)
        console.error('Código de error:', error.code)
        console.error('Detalles:', error.details)
        throw error
      }
      
      setObra(data)
      setEditMode(false)
      console.log('Obra actualizada exitosamente')
    } catch (err) {
      console.error('Error completo al actualizar obra:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al guardar'
      console.log('Mensaje de error:', errorMessage)
      setError(`Error al guardar: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditForm({})
  }

  const avanceGeneral = tareas.length > 0 
    ? Math.round(tareas.reduce((acc, tarea) => acc + tarea.avance, 0) / tareas.length)
    : 0

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando datos de la obra...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    </div>
  )
  if (!obra) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <div className="text-gray-600 mb-4">Obra no encontrada</div>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-4 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de la obra...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        {obra && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Breadcrumb de navegación */}
            <div className="flex items-center text-sm text-gray-600 mb-6">
              <button
                onClick={() => window.location.href = '/'}
                className="hover:text-blue-600 transition-colors"
              >
                Zonas
              </button>
              <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => window.location.href = `/zonas/${obra.escuelas.id_zona}`}
                className="hover:text-blue-600 transition-colors"
              >
                {obra.escuelas?.zonas?.nombre || 'Sin zona'}
              </button>
              <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => window.location.href = `/escuelas/${obra.id_escuela}`}
                className="hover:text-blue-600 transition-colors"
              >
                {obra.escuelas?.nombre || 'Sin escuela'}
              </button>
              <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">
                {obra.nombre || `Obra ${obra.numero_obra}`}
              </span>
            </div>

            {/* Tarjeta de información principal */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {obra.nombre || `Obra ${obra.numero_obra}`}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{obra.escuelas?.nombre || 'Sin escuela'}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{obra.escuelas?.zonas?.nombre || 'Sin zona'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getEstadoColor(obra.estado)}`}>
                    {obra.estado.replace('_', ' ').toUpperCase()}
                  </span>
                  {!editMode && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Formulario de edición */}
            {editMode && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Editar Obra</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la obra</label>
                    <input
                      type="text"
                      value={editForm.nombre || ''}
                      onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={editForm.estado || ''}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inicio previsto</label>
                    <input
                      type="date"
                      value={editForm.fecha_inicio_prevista ? new Date(editForm.fecha_inicio_prevista).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({...editForm, fecha_inicio_prevista: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fin previsto</label>
                    <input
                      type="date"
                      value={editForm.fecha_fin_prevista ? new Date(editForm.fecha_fin_prevista).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({...editForm, fecha_fin_prevista: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inicio real</label>
                    <input
                      type="date"
                      value={editForm.fecha_inicio_real ? new Date(editForm.fecha_inicio_real).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({...editForm, fecha_inicio_real: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fin real</label>
                    <input
                      type="date"
                      value={editForm.fecha_fin_real ? new Date(editForm.fecha_fin_real).toISOString().split('T')[0] : ''}
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
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Información General</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <p className="font-medium">{obra.nombre || 'Sin nombre'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Número:</span>
                    <p className="font-medium">{obra.numero_obra || 'Sin número'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">N° Expediente:</span>
                    <p className="font-medium">{obra.nro_de_expte || 'Sin expediente'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Estado:</span>
                    <p className="font-medium">{obra.estado}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ID:</span>
                    <p className="font-mono text-sm">{obra.id_obra}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Fechas</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Inicio previsto:</span>
                    <p className="font-medium">
                      {obra.fecha_inicio_prevista ? new Date(obra.fecha_inicio_prevista).toLocaleDateString() : 'No definida'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Fin previsto:</span>
                    <p className="font-medium">
                      {obra.fecha_fin_prevista ? new Date(obra.fecha_fin_prevista).toLocaleDateString() : 'No definida'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Inicio real:</span>
                    <p className="font-medium">
                      {obra.fecha_inicio_real ? new Date(obra.fecha_inicio_real).toLocaleDateString() : 'No iniciada'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Fin real:</span>
                    <p className="font-medium">
                      {obra.fecha_fin_real ? new Date(obra.fecha_fin_real).toLocaleDateString() : 'No finalizada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de tareas */}
        {tareas.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Tareas de la obra</h2>
                    <p className="text-sm text-gray-600">{tareas.length} tarea{tareas.length !== 1 ? 's' : ''} encontradas</p>
                  </div>
                </div>
                <a
                  href={`/obras/${idObra}/tareas`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Gestionar Tareas
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {tareas.map((tarea) => (
                <div key={tarea.id_tarea} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {tarea.nombre || tarea.descripcion}
                          </h3>
                        </div>
                        <p className="text-sm text-purple-600 font-medium mb-3">{tarea.rubros.nombre}</p>
                        
                        {/* Información de la empresa */}
                        {tarea.empresas && (
                          <div className="flex items-center bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{tarea.empresas.nombre}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-600">
                                {tarea.empresas?.cuit && <span>CUIT: {String(tarea.empresas.cuit)}</span>}
                                {tarea.empresas?.telefono && <span>Tel: {String(tarea.empresas.telefono)}</span>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTareaEstadoColor(tarea.estado || '')}`}>
                        {tarea.estado || 'sin estado'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Avance</span>
                        <span className="text-sm font-bold text-blue-600">{tarea.avance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${tarea.avance}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {tarea.cantidad_total && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs mb-1">Cantidad</span>
                          <span className="font-semibold text-gray-900">
                            {tarea.cantidad_total} {tarea.unidad_medida || ''}
                          </span>
                        </div>
                      )}
                      
                      {tarea.presupuesto && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs mb-1">Presupuesto</span>
                          <span className="font-semibold text-gray-900">
                            ${tarea.presupuesto.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {tarea.fecha_inicio_prevista && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs mb-1">Inicio</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(tarea.fecha_inicio_prevista).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {tarea.fecha_fin_prevista && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs mb-1">Fin</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(tarea.fecha_fin_prevista).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {tarea.observaciones_plan && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Observaciones:</span>
                            <p className="text-sm text-gray-600 mt-1">{tarea.observaciones_plan}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
