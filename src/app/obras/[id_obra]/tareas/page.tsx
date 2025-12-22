import { TareasPage } from '@/components/tareas/TareasPage'

export default async function TareasObraPage({ params }: { params: Promise<{ id_obra: string }> }) {
  const { id_obra } = await params
  return <TareasPage idObra={id_obra} />
}
