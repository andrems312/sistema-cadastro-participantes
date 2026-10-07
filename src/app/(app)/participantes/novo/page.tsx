import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/misc";
import { ParticipanteForm } from "@/components/participantes/participante-form";

export const metadata: Metadata = { title: "Cadastrar participante" };

export default function NovoParticipantePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        titulo="Cadastrar Participante"
        descricao="Campos com * são obrigatórios. Use a consulta de CNPJ e o CEP para agilizar o preenchimento."
      />
      <ParticipanteForm />
    </div>
  );
}
