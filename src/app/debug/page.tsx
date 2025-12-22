'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    async function runTests() {
      const logs: string[] = []
      
      // Test 1: Variables de entorno
      logs.push(`URL Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configurada' : '✗ Faltante'}`)
      logs.push(`Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ Faltante'}`)
      
      // Test 2: Conexión básica (sin consultar tablas)
      try {
        const { data, error } = await supabase.from('zonas').select('count')
        if (error) {
          logs.push(`❌ Error conexión: ${JSON.stringify(error)}`)
        } else {
          logs.push(`✅ Conexión exitosa`)
        }
      } catch (err) {
        logs.push(`❌ Error catch: ${err}`)
      }
      
      // Test 3: Listar tablas disponibles
      try {
        const { data, error } = await supabase.rpc('get_table_names') // Esto probablemente falle
        if (error) {
          logs.push(`ℹ️ No se pueden listar tablas (esperado): ${error.message}`)
        }
      } catch (err) {
        logs.push(`ℹ️ Función RPC no disponible (esperado)`)
      }
      
      setResults(logs)
    }
    
    runTests()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conexión</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-3">Resultados:</h2>
        {results.map((log, i) => (
          <div key={i} className="font-mono text-sm mb-2">{log}</div>
        ))}
      </div>
      
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h2 className="font-semibold mb-3">Soluciones comunes:</h2>
        <ol className="list-decimal ml-6 space-y-2">
          <li>
            <strong>RLS (Row Level Security):</strong>
            <p className="text-sm mt-1">En Supabase → Authentication → Policies, agregá una política para la tabla 'zonas' que permita SELECT para el rol 'anon'.</p>
          </li>
          <li>
            <strong>CORS:</strong>
            <p className="text-sm mt-1">En Supabase → Settings → API, agregá <code>http://localhost:3003</code> a los allowed origins.</p>
          </li>
          <li>
            <strong>Tabla vacía:</strong>
            <p className="text-sm mt-1">Si la tabla 'zonas' existe pero está vacía, el error puede ser por RLS igualmente.</p>
          </li>
        </ol>
      </div>
    </div>
  )
}
