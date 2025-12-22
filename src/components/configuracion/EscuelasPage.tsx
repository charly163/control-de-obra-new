'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Escuela = Database['public']['Tables']['escuelas']['Row'] & {
  zonas: Database['public']['Tables']['zonas']['Row']
}

export function EscuelasPage() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [zonas, setZonas] = useState<Database['public']['Tables']['zonas']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Escuela>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [escuelasRes, zonasRes] = await Promise.all([
        supabase
          .from('escuelas')
          .select(`
            *,
            zonas:zonas(nombre)
          `)
          .order('nombre'),
        supabase
          .from('zonas')
          .select('*')
          .order('nombre')
      ])

      if (escuelasRes.error) throw escuelasRes.error
      if (zonasRes.error) throw zonasRes.error

      setEscuelas(escuelasRes.data || [])
      setZonas(zonasRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditForm({
      nombre: '',
      direccion: '',
      id_zona: ''
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
            id_zona: editForm.id_zona
          })

        if (error) throw error
      }

      setEditMode(false)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar escuela')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta escuela? Esto podría afectar obras relacionadas.')) return
    
    try {
      const { error } = await supabase
        .from('escuelas')
        .delete()
        .eq('id_escuela', id)

      if (error) throw error
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar escuela')
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditForm({})
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando escuelas...</p>
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
                  href="/"
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </a>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
              </div>
              <p className="text-gray-600">Gestión de escuelas</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        {/* Formulario de edición */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editForm.id_escuela ? 'Editar Escuela' : 'Nueva Escuela'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la escuela *</label>
                <input
                  type="text"
                  value={editForm.nombre || ''}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Escuela Primaria N°123"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona *</label>
                <select
                  value={editForm.id_zona || ''}
                  onChange={(e) => setEditForm({...editForm, id_zona: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar zona...</option>
                  {zonas.map((zona) => (
                    <option key={zona.id_zona} value={zona.id_zona}>
                      {zona.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  type="text"
                  value={editForm.direccion || ''}
                  onChange={(e) => setEditForm({...editForm, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Calle 123, Ciudad, Provincia"
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
              <h2 className="text-xl font-semibold text-gray-900">Escuelas</h2>
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
          
          <div className="divide-y divide-gray-200">
            {escuelas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay escuelas registradas
              </div>
            ) : (
              escuelas.map((escuela) => (
                <div key={escuela.id_escuela} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{escuela.nombre}</h3>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                        {escuela.zonas && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Zona: {escuela.zonas.nombre}</span>
                          </div>
                        )}
                        {escuela.direccion && <span>Dirección: {escuela.direccion}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(escuela)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(escuela.id_escuela)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
