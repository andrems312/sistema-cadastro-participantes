"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  descricao: ReactNode;
  textoConfirmar?: string;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmação acessível baseado no <dialog> nativo
 * (foco preso no modal, ESC fecha, leitores de tela anunciam).
 */
export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  textoConfirmar = "Confirmar",
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-titulo"
      aria-describedby="confirm-descricao"
      onCancel={(e) => {
        e.preventDefault();
        if (!carregando) onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 shadow-xl"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <div>
            <h2 id="confirm-titulo" className="text-lg font-semibold text-slate-900">
              {titulo}
            </h2>
            <div id="confirm-descricao" className="mt-2 text-sm text-slate-600">
              {descricao}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onCancelar} disabled={carregando} autoFocus>
            Cancelar
          </Button>
          <Button variante="danger" onClick={onConfirmar} carregando={carregando}>
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
