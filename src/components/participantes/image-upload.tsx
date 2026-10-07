"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPLOAD } from "@/lib/constants";
import { validarArquivoImagem } from "@/lib/validations/upload";

interface ImageUploadProps {
  /** URL da imagem já salva (edição). */
  urlAtual: string | null;
  /** Arquivo novo selecionado (ainda não enviado). */
  arquivo: File | null;
  onSelecionar: (arquivo: File | null) => void;
  onRemover: () => void;
  maxBytes?: number;
  rotulo?: string;
  erro?: string;
  onErro?: (mensagem: string) => void;
}

/** Seleção de imagem com prévia, substituição e remoção (o envio ocorre ao salvar). */
export function ImageUpload({
  urlAtual,
  arquivo,
  onSelecionar,
  onRemover,
  maxBytes = UPLOAD.maxBytesParticipante,
  rotulo = "Imagem do participante",
  erro,
  onErro,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(null);

  useEffect(() => {
    if (!arquivo) {
      setPrevia(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const exibida = previa ?? urlAtual;

  function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!f) return;
    const mensagem = validarArquivoImagem(f, maxBytes);
    if (mensagem) {
      onErro?.(mensagem);
      return;
    }
    onSelecionar(f);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {exibida ? (
          <img src={exibida} alt="Prévia da imagem" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-8 text-slate-400" aria-hidden />
        )}
        {previa && (
          <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 py-0.5 text-center text-[11px] font-medium text-white">
            Não salva
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {rotulo}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={UPLOAD.extensoes}
          onChange={aoEscolher}
          className="sr-only"
          aria-describedby={`${inputId}-dica`}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variante="outline"
            tamanho="sm"
            onClick={() => inputRef.current?.click()}
            icone={exibida ? <RefreshCw className="size-4" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          >
            {exibida ? "Substituir imagem" : "Selecionar imagem"}
          </Button>
          {exibida && (
            <Button
              variante="ghost"
              tamanho="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => (previa ? onSelecionar(null) : onRemover())}
              icone={<Trash2 className="size-4" aria-hidden />}
            >
              {previa ? "Descartar seleção" : "Remover imagem"}
            </Button>
          )}
        </div>
        <p id={`${inputId}-dica`} className="text-xs text-slate-500">
          JPG, JPEG, PNG ou WEBP · até {Math.round(maxBytes / 1024 / 1024)} MB
        </p>
        {erro && (
          <p className="text-sm text-red-600" role="alert">
            {erro}
          </p>
        )}
      </div>
    </div>
  );
}
