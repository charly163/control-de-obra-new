import { EscuelaDetailPage } from '@/components/escuelas/EscuelaDetailPage'

export default async function EscuelaPage({ params }: { params: Promise<{ id_escuela: string }> }) {
  const { id_escuela } = await params
  return <EscuelaDetailPage idEscuela={id_escuela} />
}
