import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX, UserPlus, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Paginacao } from "@/components/ui/paginacao";
import { FiltrosParticipantes } from "@/components/participantes/filtros";
import { ListaParticipantes } from "@/components/participantes/lista-participantes";
import { ehAdmin, requireUsuario } from "@/lib/auth/session";
import { listarParticipantes, type FiltrosParticipantes as Filtros } from "@/lib/services/participantes";

export const metadata: Metadata = { title: "Participantes" };

export default async function ParticipantesPage({ searchParams }: { searchParams: Promise<Filtros> }) {
  const filtros = await searchParams;
  const sessao = await requireUsuario();
  const { itens, total, pagina, totalPaginas } = await listarParticipantes(filtros);
  const filtrando = Boolean(filtros.q || filtros.categoria || filtros.estado || filtros.tipo);

  return (
    <>
      <PageHeader
        titulo="Participantes"
        descricao="Pesquise, visualize e gerencie os participantes e empresas cadastrados."
        acoes={
          <ButtonLink href="/participantes/novo" icone={<UserPlus className="size-4" aria-hidden />}>
            Cadastrar participante
          </ButtonLink>
        }
      />

      <Suspense>
        <FiltrosParticipantes />
      </Suspense>

      <p className="mb-3 text-sm text-slate-500" aria-live="polite">
        {total === 1 ? "1 participante encontrado" : `${total} participantes encontrados`}
      </p>

      {itens.length === 0 ? (
        filtrando ? (
          <EmptyState
            icone={<SearchX className="size-6" aria-hidden />}
            titulo="Nenhum resultado"
            descricao="Não encontramos participantes com esses critérios. Tente outro termo ou limpe os filtros."
          />
        ) : (
          <EmptyState
            icone={<UsersRound className="size-6" aria-hidden />}
            titulo="Nenhum participante cadastrado"
            descricao="Comece cadastrando o primeiro participante ou empresa."
            acao={
              <ButtonLink href="/participantes/novo" icone={<UserPlus className="size-4" aria-hidden />}>
                Cadastrar participante
              </ButtonLink>
            }
          />
        )
      ) : (
        <ListaParticipantes itens={itens} admin={ehAdmin(sessao)} />
      )}

      <Paginacao pagina={pagina} totalPaginas={totalPaginas} total={total} params={{ ...filtros }} caminho="/participantes" />
    </>
  );
}
