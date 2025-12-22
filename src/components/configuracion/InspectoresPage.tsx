'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Inspector = Database['public']['Tables']['inspectores']['Row']

export function InspectoresPage() {
  const [inspectores, setInspectores] = useState<Inspector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Inspector>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInspectores()
  }, [])

  async function fetchInspectores() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inspectores')
        .select('*')
        .order('nombre')

      if (error) throw error
      setInspectores(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inspectores')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditForm({
      nombre: '',
      email: '',
      telefono: '',
      rol: 'inspector'
    })
    setEditMode(true)
  }

  const handleEdit = (inspector: Inspector) => {
    setEditForm(inspector)
    setEditMode(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (editForm.id_inspector) {
        // Actualizar
        const { error } = await supabase
          .from('inspectores')
          .update({
            nombre: editForm.nombre,
            email: editForm.email,
            telefono: editForm.telefono,
            rol: editForm.rol
          })
          .eq('id_inspector', editForm.id_inspector)

        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('inspectores')
          .insert({
            nombre: editForm.nombre,
            email: editForm.email,
            telefono: editForm.telefono,
            rol: editForm.rol || 'inspector'
          })

        if (error) throw error
      }

      setEditMode(false)
      await fetchInspectores()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar inspector')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este inspector?')) return
    
    try {
      const { error } = await supabase
        .from('inspectores')
        .delete()
        .eq('id_inspector', id)

      if (error) throw error
      await fetchInspectores()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar inspector')
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
        <p className="text-gray-600">Cargando inspectores...</p>
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
              <p className="text-gray-600">Gestión de inspectores</p>
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
              {editForm.id_inspector ? 'Editar Inspector' : 'Nuevo Inspector'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={editForm.nombre || ''}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={editForm.telefono || ''}
                  onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={editForm.rol || 'inspector'}
                  onChange={(e) => setEditForm({...editForm, rol: e.target.value as 'inspector' | 'jefe'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inspector">Inspector</option>
                  <option value="jefe">Jefe</option>
                </select>
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
                disabled={saving || !editForm.nombre}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de inspectores */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Inspectores</h2>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Inspector
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {inspectores.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay inspectores registrados
              </div>
            ) : (
              inspectores.map((inspector: Inspector) => (
                <div key={inspector.id_inspector} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{inspector.nombre}</h3>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                        {inspector.email && <span>Email: {inspector.email}</span>}
                        {inspector.telefono && <span>Tel: {inspector.telefono}</span>}
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {inspector.rol === 'jefe' ? 'Jefe' : 'Inspector'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(inspector)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(inspector.id_inspector)}
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
