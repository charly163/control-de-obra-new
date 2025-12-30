import { ObraDetailPage } from '@/components/obras/ObraDetailPage'
import { supabase } from '@/lib/supabase'

export default async function ObraPage({ params }: { params: Promise<{ id_obra: string }> }) {
  const { id_obra } = await params
  console.log('Página de obra cargada con ID:', id_obra)
  return <ObraDetailPage idObra={id_obra} />
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
    console.error('Error generating static params for obras:', error)
    return []
  }
}
