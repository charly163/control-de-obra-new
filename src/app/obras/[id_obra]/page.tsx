import { ObraDetailPage } from '@/components/obras/ObraDetailPage'

export default async function ObraPage({ params }: { params: Promise<{ id_obra: string }> }) {
  const { id_obra } = await params
  console.log('Página de obra cargada con ID:', id_obra)
  return <ObraDetailPage idObra={id_obra} />
}
