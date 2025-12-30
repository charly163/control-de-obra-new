import { EscuelaDetailPage } from '@/components/escuelas/EscuelaDetailPage'
import { supabase } from '@/lib/supabase'

export default async function EscuelaPage({ params }: { params: Promise<{ id_escuela: string }> }) {
  const { id_escuela } = await params
  return <EscuelaDetailPage idEscuela={id_escuela} />
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('escuelas')
      .select('id_escuela')
    
    if (!data) return []
    
    return data.map((escuela) => ({
      id_escuela: escuela.id_escuela
    }))
  } catch (error) {
    console.error('Error generating static params for escuelas:', error)
    return []
  }
}
