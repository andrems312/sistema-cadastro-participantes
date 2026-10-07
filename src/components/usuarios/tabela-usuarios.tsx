"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck, Trash2, X } from "lucide-react";
import { alterarTipoAcesso, excluirUsuario, recusarSolicitacao } from "@/actions/usuarios";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/field";
import { Avatar, Badge } from "@/components/ui/misc";
import { formatarData } from "@/lib/utils/format";
import type { ActionResult, TipoAcesso, Usuario } from "@/types/database";

export function TabelaUsuarios({ usuarios, idAtual }: { usuarios: Usuario[]; idAtual: string }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<Usuario | null>(null);

  function executar(id: string, acao: () => Promise<ActionResult>) {
    setOcupado(id);
    startTransition(async () => {
      const r = await acao();
      setOcupado(null);
      if (r.ok) {
        toast.success(r.message ?? "Alteração salva.");
        router.refresh();
      } else toast.error(r.message);
    });
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const alvo = excluir;
    setOcupado(alvo.id);
    const r = await excluirUsuario(alvo.id);
    setOcupado(null);
    if (r.ok) {
      toast.success(r.message ?? "Usuário excluído.");
      setExcluir(null);
      router.refresh();
    } else toast.error(r.message);
  }

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {usuarios.map((u) => {
          const eu = u.id === idAtual;
          const solicitouAdmin = u.tipo_solicitado === "admin" && u.tipo_acesso !== "admin";
          const carregando = pendente && ocupado === u.id;
          return (
            <li key={u.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar nome={u.nome} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                    <span className="truncate">{u.nome}</span>
                    {eu && <Badge tom="sucesso">Você</Badge>}
                    {u.tipo_acesso === "admin" && (
                      <Badge tom="marca">
                        <ShieldCheck className="size-3.5" aria-hidden /> Admin
                      </Badge>
                    )}
                    {solicitouAdmin && <Badge tom="alerta">Solicitou acesso de administrador</Badge>}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {u.email} · desde {formatarData(u.criado_em)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {solicitouAdmin && (
                  <>
                    <Button
                      tamanho="sm"
                      variante="secondary"
                      icone={<Check className="size-4" aria-hidden />}
                      disabled={carregando}
                      onClick={() => executar(u.id, () => alterarTipoAcesso(u.id, "admin"))}
                    >
                      Aprovar
                    </Button>
                    <Button
                      tamanho="sm"
                      variante="ghost"
                      icone={<X className="size-4" aria-hidden />}
                      disabled={carregando}
                      onClick={() => executar(u.id, () => recusarSolicitacao(u.id))}
                    >
                      Recusar
                    </Button>
                  </>
                )}
                <label className="sr-only" htmlFor={`tipo-${u.id}`}>
                  Tipo de acesso de {u.nome}
                </label>
                <Select
                  id={`tipo-${u.id}`}
                  value={u.tipo_acesso}
                  disabled={eu || carregando}
                  title={eu ? "Você não pode alterar o próprio acesso" : undefined}
                  onChange={(e) => executar(u.id, () => alterarTipoAcesso(u.id, e.target.value as TipoAcesso))}
                  className="w-auto min-w-36"
                >
                  <option value="usuario">Usuário</option>
                  <option value="admin">Administrador</option>
                </Select>
                <Button
                  variante="ghost"
                  tamanho="icon"
                  disabled={eu || carregando}
                  onClick={() => setExcluir(u)}
                  aria-label={`Excluir ${u.nome}`}
                  title={eu ? "Você não pode excluir o próprio acesso" : "Excluir usuário"}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        aberto={Boolean(excluir)}
        titulo="Excluir usuário?"
        descricao={
          <>
            O acesso de <strong className="text-slate-900">{excluir?.nome}</strong> ({excluir?.email}) será removido
            permanentemente. Os participantes cadastrados por ele serão mantidos.
          </>
        }
        textoConfirmar="Sim, excluir"
        carregando={Boolean(excluir) && ocupado === excluir?.id}
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluir(null)}
      />
    </>
  );
}
