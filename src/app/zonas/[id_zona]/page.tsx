import { ZonaDetailPage } from '@/components/zonas/ZonaDetailPage'

export default async function ZonaPage({ params }: { params: Promise<{ id_zona: string }> }) {
  const { id_zona } = await params
  return <ZonaDetailPage idZona={id_zona} />
}
