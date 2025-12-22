'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { generarResumenPDF, DatosPDF } from '@/utils/pdfGenerator'

type Tarea = Database['public']['Tables']['tareas']['Row'] & {
  rubros: Pick<Database['public']['Tables']['rubros']['Row'], 'nombre'>
  empresas?: Pick<Database['public']['Tables']['empresas']['Row'], 'nombre'>
}
type Obra = Database['public']['Tables']['obras']['Row'] & {
  escuelas: Pick<Database['public']['Tables']['escuelas']['Row'], 'nombre' | 'direccion'> & {
    zonas: Pick<Database['public']['Tables']['zonas']['Row'], 'nombre'>
  }
}
type Rubro = Database['public']['Tables']['rubros']['Row']
type Empresa = Database['public']['Tables']['empresas']['Row']

export function TareasPage({ idObra }: { idObra: string }) {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [obra, setObra] = useState<Obra | null>(null)
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Tarea>>({})
  const [saving, setSaving] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  useEffect(() => {
    fetchTareasData()
    fetchRubros()
    fetchEmpresas()
  }, [idObra])

  async function fetchTareasData() {
    try {
      const [tareasRes, obraRes] = await Promise.all([
        supabase
          .from('tareas')
          .select(`
            *,
            rubros:rubros(nombre),
            empresas:empresas(nombre)
          `)
          .eq('id_obra', idObra)
          .order('nombre', { ascending: true }),
        supabase
          .from('obras')
          .select(`
            *,
            escuelas:escuelas(
              nombre,
              zonas:zonas(nombre)
            )
          `)
          .eq('id_obra', idObra)
          .single()
      ])

      if (tareasRes.error) throw tareasRes.error
      if (obraRes.error) throw obraRes.error

      setTareas(tareasRes.data || [])
      setObra(obraRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  async function fetchRubros() {
    try {
      const { data } = await supabase
        .from('rubros')
        .select('*')
        .order('nombre')
      setRubros(data || [])
    } catch (err) {
      console.error('Error al cargar rubros:', err)
    }
  }

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

  const filteredTareas = tareas.filter(tarea =>
    tarea.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tarea.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tarea.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular avance total de la obra
  const avanceObra = tareas.length > 0 
    ? Math.round(tareas.reduce((acc, tarea) => acc + (tarea.avance || 0), 0) / tareas.length)
    : 0

  const handleCreate = () => {
    setEditForm({ 
      id_obra: idObra,
      id_rubro: '',
      id_empresa: '',
      nombre: '',
      descripcion: '',
      unidad_medida: '',
      cantidad_total: 0,
      cantidad_inicial: 0,
      presupuesto: 0,
      avance_planificado_porcentaje: 0,
      avance: 0,
      estado: 'pendiente',
      prioridad: 'media'
    })
    setEditMode(true)
  }

  const handleEdit = (tarea: Tarea) => {
    setEditForm(tarea)
    setEditMode(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (editForm.id_tarea) {
        // Actualizar
        const { error } = await supabase
          .from('tareas')
          .update({
            nombre: editForm.nombre,
            descripcion: editForm.descripcion,
            unidad_medida: editForm.unidad_medida,
            cantidad_total: editForm.cantidad_total,
            cantidad_inicial: editForm.cantidad_inicial,
            presupuesto: editForm.presupuesto,
            avance_planificado_porcentaje: editForm.avance_planificado_porcentaje,
            avance: editForm.avance,
            estado: editForm.estado,
            prioridad: editForm.prioridad,
            id_rubro: editForm.id_rubro,
            id_empresa: editForm.id_empresa || null,
            fecha_inicio_prevista: editForm.fecha_inicio_prevista || null,
            fecha_fin_prevista: editForm.fecha_fin_prevista || null,
            fecha_inicio: editForm.fecha_inicio || null,
            fecha_fin: editForm.fecha_fin || null
          })
          .eq('id_tarea', editForm.id_tarea)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('tareas')
          .insert({
            id_obra: idObra,
            id_rubro: editForm.id_rubro,
            id_empresa: editForm.id_empresa || null,
            nombre: editForm.nombre,
            descripcion: editForm.descripcion,
            unidad_medida: editForm.unidad_medida,
            cantidad_total: editForm.cantidad_total,
            cantidad_inicial: editForm.cantidad_inicial,
            presupuesto: editForm.presupuesto,
            avance_planificado_porcentaje: editForm.avance_planificado_porcentaje,
            avance: editForm.avance,
            estado: editForm.estado || 'pendiente',
            prioridad: editForm.prioridad || 'media',
            fecha_inicio_prevista: editForm.fecha_inicio_prevista || null,
            fecha_fin_prevista: editForm.fecha_fin_prevista || null,
            fecha_inicio: editForm.fecha_inicio || null,
            fecha_fin: editForm.fecha_fin || null
          })

        if (error) throw error
      }

      setEditMode(false)
      await fetchTareasData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar tarea')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerarPDF = async () => {
    if (!obra || !obra.escuelas || !obra.escuelas.zonas) {
      setError('No se puede generar el PDF: falta información de la obra')
      return
    }

    try {
      setGenerandoPDF(true)
      
      // Preparar datos para el PDF
      const datosPDF: DatosPDF = {
        zona: {
          nombre: obra.escuelas.zonas.nombre
        },
        escuela: {
          nombre: obra.escuelas.nombre,
          direccion: obra.escuelas.direccion || undefined
        },
        obra: {
          nombre: obra.nombre || 'Sin nombre',
          numero_obra: obra.numero_obra || undefined,
          nro_de_expte: obra.nro_de_expte || undefined,
          estado: obra.estado || 'sin estado',
          fecha_inicio_prevista: obra.fecha_inicio_prevista || undefined,
          fecha_fin_prevista: obra.fecha_fin_prevista || undefined,
          fecha_inicio_real: obra.fecha_inicio_real || undefined,
          fecha_fin_real: obra.fecha_fin_real || undefined
        },
        tareas: tareas.map(tarea => ({
          nombre: tarea.nombre || 'Sin nombre',
          descripcion: tarea.descripcion || '',
          estado: tarea.estado || 'pendiente',
          avance: tarea.avance || 0,
          cantidad_total: tarea.cantidad_total || undefined,
          cantidad_inicial: tarea.cantidad_inicial || undefined,
          presupuesto: tarea.presupuesto || undefined,
          unidad_medida: tarea.unidad_medida || undefined,
          empresa: tarea.empresas?.nombre || undefined,
          fecha_inicio_prevista: tarea.fecha_inicio_prevista || undefined,
          fecha_fin_prevista: tarea.fecha_fin_prevista || undefined,
          fecha_inicio: tarea.fecha_inicio || undefined,
          fecha_fin: tarea.fecha_fin || undefined
        })),
        avanceTotal: tareas.length > 0 
          ? Math.round(tareas.reduce((acc, tarea) => acc + (tarea.avance || 0), 0) / tareas.length)
          : 0
      }

      // Generar PDF
      generarResumenPDF(datosPDF)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.')) return
    
    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id_tarea', id)

      if (error) throw error
      await fetchTareasData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tarea')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditForm({})
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'en_progreso': return 'bg-blue-100 text-blue-800'
      case 'completada': return 'bg-green-100 text-green-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'bloqueada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baja': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>
  if (!obra) return <div className="p-8">Obra no encontrada</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <a
                  href={`/obras/${idObra}`}
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </a>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{obra.nombre}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    {obra.escuelas?.zonas && obra.escuelas.zonas.nombre && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {obra.escuelas.zonas.nombre}
                      </span>
                    )}
                    {obra.escuelas && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {obra.escuelas.nombre}
                      </span>
                    )}
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {obra.nombre}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">Tareas de la obra</p>
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
                  placeholder="Buscar tareas por nombre, descripción o estado..."
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
              Nueva Tarea
            </button>
            <button
              onClick={handleGenerarPDF}
              disabled={generandoPDF || !obra}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {generandoPDF ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>

        {/* Formulario de edición */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editForm.id_tarea ? 'Editar Tarea' : 'Nueva Tarea'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la tarea *</label>
                <input
                  type="text"
                  value={editForm.nombre || ''}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rubro *</label>
                <select
                  value={editForm.id_rubro || ''}
                  onChange={(e) => setEditForm({...editForm, id_rubro: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar rubro</option>
                  {rubros.map((rubro) => (
                    <option key={rubro.id_rubro} value={rubro.id_rubro}>
                      {rubro.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <select
                  value={editForm.id_empresa || ''}
                  onChange={(e) => setEditForm({...editForm, id_empresa: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id_empresa} value={empresa.id_empresa}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={editForm.estado || 'pendiente'}
                  onChange={(e) => setEditForm({...editForm, estado: e.target.value as 'pendiente' | 'en_progreso' | 'bloqueada' | 'completada'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="bloqueada">Bloqueada</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={editForm.prioridad || 'media'}
                  onChange={(e) => setEditForm({...editForm, prioridad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de medida</label>
                <input
                  type="text"
                  value={editForm.unidad_medida || ''}
                  onChange={(e) => setEditForm({...editForm, unidad_medida: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: m2, kg, unidades"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad total</label>
                <input
                  type="number"
                  value={editForm.cantidad_total || ''}
                  onChange={(e) => setEditForm({...editForm, cantidad_total: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto</label>
                <input
                  type="number"
                  value={editForm.presupuesto || ''}
                  onChange={(e) => setEditForm({...editForm, presupuesto: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avance (%)</label>
                <input
                  type="number"
                  value={editForm.avance || ''}
                  onChange={(e) => setEditForm({...editForm, avance: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
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
              
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={editForm.descripcion || ''}
                  onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción detallada de la tarea..."
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
                disabled={saving || !editForm.nombre || !editForm.id_rubro}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de tareas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Tareas {searchTerm && `(filtrando: ${filteredTareas.length} de ${tareas.length})`}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-lg">
                  <span className="text-gray-700 font-semibold">Avance de la obra: </span>
                  <span className="text-2xl font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">{avanceObra}%</span>
                </div>
                <div className="w-48 bg-gray-200 rounded-full h-4 shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${avanceObra}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredTareas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No se encontraron tareas que coincidan con la búsqueda' : 'No hay tareas registradas en esta obra'}
              </div>
            ) : (
              filteredTareas.map((tarea) => (
                <div key={tarea.id_tarea} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{tarea.nombre || 'Sin nombre'}</h3>
                        {tarea.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{tarea.descripcion}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                          {tarea.rubros && <span>Rubro: {tarea.rubros.nombre}</span>}
                          {tarea.unidad_medida && <span>Unidad: {tarea.unidad_medida}</span>}
                          {tarea.cantidad_total && <span>Cantidad: {tarea.cantidad_total}</span>}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado || 'pendiente')}`}>
                            {tarea.estado || 'pendiente'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(tarea.prioridad || 'media')}`}>
                            {tarea.prioridad || 'media'}
                          </span>
                        </div>
                        {tarea.avance !== undefined && tarea.avance > 0 && (
                          <div className="flex items-center space-x-3 mt-3">
                            <span className="text-base font-semibold text-gray-700">Avance:</span>
                            <div className="flex-1 max-w-sm bg-gray-200 rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${tarea.avance}%` }}
                              ></div>
                            </div>
                            <span className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{tarea.avance}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <button
                        onClick={() => handleEdit(tarea)}
                        className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                        title="Editar"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(tarea.id_tarea)}
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
