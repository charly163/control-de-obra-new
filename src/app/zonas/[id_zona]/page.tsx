import { ZonaDetailPage } from '@/components/zonas/ZonaDetailPage'
import { supabase } from '@/lib/supabase'

export default async function ZonaPage({ params }: { params: Promise<{ id_zona: string }> }) {
  const { id_zona } = await params
  return <ZonaDetailPage idZona={id_zona} />
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('zonas')
      .select('id_zona')
    
    if (!data) return []
    
    return data.map((zona) => ({
      id_zona: zona.id_zona
    }))
  } catch (error) {
    console.error('Error generating static params for zonas:', error)
    return []
  }
}
