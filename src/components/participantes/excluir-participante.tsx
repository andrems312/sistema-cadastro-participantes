"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { excluirParticipante } from "@/actions/participantes";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  id: string;
  nome: string;
  /** Para onde ir após excluir (ex.: na página de detalhes volta para a lista). */
  redirecionarPara?: string;
  compacto?: boolean;
}

export function ExcluirParticipante({ id, nome, redirecionarPara, compacto }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function confirmar() {
    setExcluindo(true);
    const r = await excluirParticipante(id);
    setExcluindo(false);
    if (!r.ok) {
      toast.error(r.message);
      return;
    }
    setAberto(false);
    toast.success(r.message ?? "Participante excluído.");
    if (redirecionarPara) router.push(redirecionarPara);
    router.refresh();
  }

  return (
    <>
      {compacto ? (
        <Button
          variante="ghost"
          tamanho="icon"
          onClick={() => setAberto(true)}
          aria-label={`Excluir ${nome}`}
          title="Excluir"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      ) : (
        <Button variante="outline" onClick={() => setAberto(true)} icone={<Trash2 className="size-4" aria-hidden />} className="text-red-600 hover:bg-red-50">
          Excluir
        </Button>
      )}
      <ConfirmDialog
        aberto={aberto}
        titulo="Excluir participante?"
        descricao={
          <>
            O cadastro de <strong className="text-slate-900">{nome}</strong> e a imagem associada serão removidos
            permanentemente. Esta ação não pode ser desfeita.
          </>
        }
        textoConfirmar="Sim, excluir"
        carregando={excluindo}
        onConfirmar={confirmar}
        onCancelar={() => setAberto(false)}
      />
    </>
  );
}
