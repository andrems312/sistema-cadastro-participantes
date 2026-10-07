import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { ParticipanteForm } from "@/components/participantes/participante-form";
import { obterParticipante } from "@/lib/services/participantes";

export const metadata: Metadata = { title: "Editar participante" };

export default async function EditarParticipantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participante = await obterParticipante(id);
  if (!participante) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader titulo="Editar participante" descricao={participante.nome} />
      <ParticipanteForm participante={participante} />
    </div>
  );
}
