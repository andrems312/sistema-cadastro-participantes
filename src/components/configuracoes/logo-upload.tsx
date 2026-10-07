"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { definirLogo, removerLogo } from "@/actions/configuracoes";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImageUpload } from "@/components/participantes/image-upload";
import { Logo } from "@/components/layout/logo";
import { UPLOAD } from "@/lib/constants";
import { enviarImagem, ErroApi } from "@/lib/services/api-client";

export function LogoUpload({ logoAtual, nome }: { logoAtual: string | null; nome: string }) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  async function enviar() {
    if (!arquivo) return;
    setEnviando(true);
    try {
      const { path } = await enviarImagem(arquivo, "logo");
      const r = await definirLogo(path);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Logo enviada com sucesso.");
      setArquivo(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ErroApi ? e.message : "Erro ao enviar a logo.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setRemovendo(true);
    const r = await removerLogo();
    setRemovendo(false);
    setConfirmarRemocao(false);
    if (r.ok) {
      toast.success(r.message ?? "Logo removida.");
      router.refresh();
    } else toast.error(r.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Logo atual</p>
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          {logoAtual ? (
            <img src={logoAtual} alt={`Logo atual de ${nome}`} className="h-16 w-auto max-w-56 object-contain" />
          ) : (
            <p className="text-sm text-slate-500">Nenhuma logo definida — o ícone padrão é exibido.</p>
          )}
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="mb-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase">Prévia no menu</p>
            <Logo logoUrl={logoAtual} nome={nome} tamanho="sm" />
          </div>
        </div>
      </div>

      <ImageUpload
        rotulo={logoAtual ? "Substituir logo" : "Enviar logo"}
        urlAtual={logoAtual}
        arquivo={arquivo}
        maxBytes={UPLOAD.maxBytesLogo}
        erro={erro}
        onErro={(m) => {
          setErro(m);
          toast.error(m);
        }}
        onSelecionar={(f) => {
          setArquivo(f);
          setErro(undefined);
        }}
        onRemover={() => setConfirmarRemocao(true)}
      />

      {arquivo && (
        <Button onClick={enviar} carregando={enviando} icone={<Upload className="size-4" aria-hidden />}>
          {enviando ? "Enviando..." : "Salvar nova logo"}
        </Button>
      )}

      <p className="text-xs text-slate-500">
        Recomendado: PNG com fundo transparente, formato horizontal, até 2 MB. A logo aparece no login, menu lateral,
        cabeçalho e dashboard.
      </p>

      <ConfirmDialog
        aberto={confirmarRemocao}
        titulo="Remover a logo?"
        descricao="A logo será excluída do armazenamento e o ícone padrão voltará a ser exibido."
        textoConfirmar="Remover logo"
        carregando={removendo}
        onConfirmar={remover}
        onCancelar={() => setConfirmarRemocao(false)}
      />
    </div>
  );
}
