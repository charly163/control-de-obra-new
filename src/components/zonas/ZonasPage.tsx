'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Zona = Database['public']['Tables']['zonas']['Row']

export function ZonasPage() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Zona>>({})
  const [saving, setSaving] = useState(false)
  const [avancesZonas, setAvancesZonas] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchZonas()
  }, [])

  useEffect(() => {
    if (zonas.length > 0) {
      calcularAvancesZonas().then(setAvancesZonas)
    }
  }, [zonas])

  const calcularAvancesZonas = async () => {
    const avances: Record<string, number> = {}
    
    for (const zona of zonas) {
      try {
        // Obtener escuelas de esta zona
        const { data: escuelasData } = await supabase
          .from('escuelas')
          .select('id_escuela')
          .eq('id_zona', zona.id_zona)

        if (!escuelasData || escuelasData.length === 0) {
          avances[zona.id_zona] = 0
          continue
        }

        // Obtener obras de todas las escuelas de esta zona
        const { data: obrasData } = await supabase
          .from('obras')
          .select('id_obra')
          .in('id_escuela', escuelasData.map(e => e.id_escuela))

        if (!obrasData || obrasData.length === 0) {
          avances[zona.id_zona] = 0
          continue
        }

        // Obtener tareas de todas las obras de esta zona
        const { data: tareasData } = await supabase
          .from('tareas')
          .select('id_obra, avance')
          .in('id_obra', obrasData.map(o => o.id_obra))

        if (!tareasData || tareasData.length === 0) {
          avances[zona.id_zona] = 0
          continue
        }

        // Calcular avance por obra
        const avancePorObra: Record<string, number[]> = {}
        tareasData.forEach(tarea => {
          if (!avancePorObra[tarea.id_obra]) {
            avancePorObra[tarea.id_obra] = []
          }
          avancePorObra[tarea.id_obra]!.push(tarea.avance || 0)
        })

        // Calcular promedio por obra y luego promedio general
        const avancesObras = Object.values(avancePorObra).map(tareasObra => 
          tareasObra.length > 0 ? tareasObra.reduce((a: number, b: number) => a + b, 0) / tareasObra.length : 0
        )

        avances[zona.id_zona] = avancesObras.length > 0 ? Math.round(avancesObras.reduce((a: number, b: number) => a + b, 0) / avancesObras.length) : 0
      } catch (err) {
        console.error(`Error calculando avance de zona ${zona.id_zona}:`, err)
        avances[zona.id_zona] = 0
      }
    }
    
    return avances
  }

  async function fetchZonas() {
    try {
      console.log('Intentando conectar a Supabase...')
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .order('nombre')

      if (error) {
        console.error('Error de Supabase:', error)
        throw error
      }
      
      console.log('Datos recibidos:', data)
      setZonas(data || [])
    } catch (err) {
      console.error('Error completo:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar zonas')
    } finally {
      setLoading(false)
    }
  }

  const filteredZonas = zonas.filter(zona =>
    zona.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setEditForm({ nombre: '' })
    setEditMode(true)
  }

  const handleEdit = (zona: Zona) => {
    setEditForm(zona)
    setEditMode(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (editForm.id_zona) {
        // Actualizar
        const { error } = await supabase
          .from('zonas')
          .update({ nombre: editForm.nombre })
          .eq('id_zona', editForm.id_zona)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('zonas')
          .insert({ nombre: editForm.nombre })

        if (error) throw error
      }

      setEditMode(false)
      await fetchZonas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar zona')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta zona? Esta acción no se puede deshacer.')) return
    
    try {
      const { error } = await supabase
        .from('zonas')
        .delete()
        .eq('id_zona', id)

      if (error) throw error
      await fetchZonas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar zona')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditForm({})
  }

  if (loading) return <div className="p-8">Cargando...</div>
  if (error) return (
    <div className="p-8">
      <div className="text-red-600 mb-4">Error: {error}</div>
      <div className="text-sm text-gray-600">
        <p>Verificá:</p>
        <ul className="list-disc ml-6">
          <li>Que el archivo .env.local exista</li>
          <li>Que las credenciales de Supabase sean correctas</li>
          <li>Que la tabla 'zonas' exista en tu base de datos</li>
          <li>Que las políticas de RLS (Row Level Security) permitan lecturas anónimas</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <a
                  href="/"
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </a>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Control de Obras</h1>
              </div>
              <p className="text-gray-600">Gestión de obras por zonas, escuelas y tareas</p>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/obras"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Gestión de Obras
              </a>
              <a
                href="/configuracion"
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
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
                  placeholder="Buscar zonas..."
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
              Nueva Zona
            </button>
          </div>
        </div>

        {/* Formulario de edición */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editForm.id_zona ? 'Editar Zona' : 'Nueva Zona'}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la zona *</label>
              <input
                type="text"
                value={editForm.nombre || ''}
                onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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

        {/* Lista de zonas */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Zonas {searchTerm && `(filtrando: ${filteredZonas.length} de ${zonas.length})`}
              </h2>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredZonas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? 'No se encontraron zonas que coincidan con la búsqueda' : 'No hay zonas registradas'}
              </div>
            ) : (
              filteredZonas.map((zona) => (
                <div key={zona.id_zona} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{zona.nombre}</h3>
                        {avancesZonas[zona.id_zona] !== undefined && avancesZonas[zona.id_zona] > 0 && (
                          <div className="flex items-center space-x-3 mt-3">
                            <span className="text-base font-semibold text-gray-700">Avance general:</span>
                            <div className="flex-1 max-w-sm bg-gray-200 rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${avancesZonas[zona.id_zona]}%` }}
                              ></div>
                            </div>
                            <span className="text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{avancesZonas[zona.id_zona]}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <a
                        href={`/zonas/${zona.id_zona}`}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        title="Ver escuelas"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Ver escuelas</span>
                      </a>
                      <button
                        onClick={() => handleEdit(zona)}
                        className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                        title="Editar"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(zona.id_zona)}
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
