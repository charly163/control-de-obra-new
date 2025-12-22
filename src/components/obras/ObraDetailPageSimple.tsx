'use client'

export function ObraDetailPageSimple({ idObra }: { idObra: string }) {
  console.log('Componente SIMPLE montado con idObra:', idObra)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Detalle de Obra</h1>
          <p className="text-gray-600 mb-2">ID de la obra: <code className="bg-gray-100 px-2 py-1 rounded">{idObra}</code></p>
          <p className="text-gray-600">Este es un componente de prueba para verificar que la ruta funciona.</p>
        </div>
      </div>
    </div>
  )
}
