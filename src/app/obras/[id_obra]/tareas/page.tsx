import { TareasPage } from '@/components/tareas/TareasPage'
import { supabase } from '@/lib/supabase'

export default async function TareasObraPage({ params }: { params: Promise<{ id_obra: string }> }) {
  const { id_obra } = await params
  return <TareasPage idObra={id_obra} />
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('obras')
      .select('id_obra')
    
    if (!data) return []
    
    return data.map((obra) => ({
      id_obra: obra.id_obra
    }))
  } catch (error) {
    console.error('Error generating static params for tareas:', error)
    return []
  }
}
