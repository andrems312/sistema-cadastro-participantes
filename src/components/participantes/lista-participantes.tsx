import Link from "next/link";
import { Eye, MapPin, Pencil } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/misc";
import { ExcluirParticipante } from "@/components/participantes/excluir-participante";
import type { ParticipanteResumo } from "@/lib/services/participantes";
import { formatarData } from "@/lib/utils/format";
import { formatarDocumento } from "@/lib/utils/masks";

function Acoes({ p, admin }: { p: ParticipanteResumo; admin: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/participantes/${p.id}`} className={buttonClasses("ghost", "icon")} aria-label={`Visualizar ${p.nome}`} title="Visualizar">
        <Eye className="size-4" aria-hidden />
      </Link>
      <Link href={`/participantes/${p.id}/editar`} className={buttonClasses("ghost", "icon")} aria-label={`Editar ${p.nome}`} title="Editar">
        <Pencil className="size-4" aria-hidden />
      </Link>
      {admin && <ExcluirParticipante id={p.id} nome={p.nome} compacto />}
    </div>
  );
}

/** Ações com rótulo e área de toque maior (celular). */
function AcoesMovel({ p, admin }: { p: ParticipanteResumo; admin: boolean }) {
  return (
    <div className="flex gap-2">
      <Link href={`/participantes/${p.id}`} className={buttonClasses("outline", "md", "flex-1")}>
        <Eye className="size-4" aria-hidden /> Ver
      </Link>
      <Link href={`/participantes/${p.id}/editar`} className={buttonClasses("outline", "md", "flex-1")}>
        <Pencil className="size-4" aria-hidden /> Editar
      </Link>
      {admin && <ExcluirParticipante id={p.id} nome={p.nome} compacto />}
    </div>
  );
}

/** Tabela no desktop/tablet e cards no celular. */
export function ListaParticipantes({ itens, admin }: { itens: ParticipanteResumo[]; admin: boolean }) {
  return (
    <>
      {/* Tabela (md+) */}
      <div className="relative hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Lista de participantes</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Participante</th>
              <th scope="col" className="px-4 py-3">CPF/CNPJ</th>
              <th scope="col" className="hidden px-4 py-3 xl:table-cell">Cidade/UF</th>
              <th scope="col" className="hidden px-4 py-3 xl:table-cell">Categoria</th>
              <th scope="col" className="hidden px-4 py-3 2xl:table-cell">Cadastro</th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {itens.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <Link href={`/participantes/${p.id}`} className="flex items-center gap-3">
                    <Avatar nome={p.nome} src={p.imagem_url} tamanho="sm" />
                    <span className="min-w-0">
                      <span className="block max-w-[16rem] truncate font-medium text-slate-900 xl:max-w-xs">{p.nome}</span>
                      <span className="block max-w-[16rem] truncate text-xs text-slate-500 xl:max-w-xs">
                        {[p.nome_fantasia, p.cidade && `${p.cidade}/${p.estado ?? ""}`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                  {formatarDocumento(p.cpf_cnpj)}
                  <Badge className="ml-2 hidden xl:inline-flex" tom={p.tipo_pessoa === "PJ" ? "marca" : "neutro"}>
                    {p.tipo_pessoa}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 xl:table-cell">
                  {p.cidade ? `${p.cidade}/${p.estado ?? ""}` : "—"}
                </td>
                <td className="hidden px-4 py-3 xl:table-cell">
                  <Badge>{p.categoria}</Badge>
                </td>
                <td className="hidden px-4 py-3 whitespace-nowrap text-slate-500 2xl:table-cell">{formatarData(p.criado_em)}</td>
                <td className="w-px px-4 py-2 whitespace-nowrap">
                  <Acoes p={p} admin={admin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (celular) */}
      <ul className="space-y-3 md:hidden">
        {itens.map((p) => (
          <li key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/participantes/${p.id}`} className="flex items-start gap-3">
              <Avatar nome={p.nome} src={p.imagem_url} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{p.nome}</p>
                {p.nome_fantasia && <p className="truncate text-sm text-slate-500">{p.nome_fantasia}</p>}
                <p className="mt-1 text-sm text-slate-600 tabular-nums">{formatarDocumento(p.cpf_cnpj)}</p>
              </div>
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tom={p.tipo_pessoa === "PJ" ? "marca" : "neutro"}>{p.tipo_pessoa === "PJ" ? "Empresa" : "Pessoa"}</Badge>
              <Badge>{p.categoria}</Badge>
              {p.cidade && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="size-3.5" aria-hidden /> {p.cidade}/{p.estado}
                </span>
              )}
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <AcoesMovel p={p} admin={admin} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
