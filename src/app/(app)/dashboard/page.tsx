import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Building2, CalendarPlus, MapPinned, UserPlus, UserRound, Users, UsersRound } from "lucide-react";
import { AvisoUrl } from "@/components/layout/aviso-url";
import { Logo } from "@/components/layout/logo";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { ehAdmin, requireUsuario } from "@/lib/auth/session";
import { getConfiguracoes } from "@/lib/services/configuracoes";
import { createClient } from "@/lib/supabase/server";
import { formatarDataHora, formatarNumero } from "@/lib/utils/format";
import type { Participante, ResumoDashboard } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

const RESUMO_VAZIO: ResumoDashboard = {
  total_participantes: 0,
  total_empresas: 0,
  total_pessoas: 0,
  total_usuarios: 0,
  com_localizacao: 0,
  ultimos_30_dias: 0,
  por_categoria: [],
};

type Recente = Pick<Participante, "id" | "nome" | "cidade" | "estado" | "categoria" | "tipo_pessoa" | "imagem_url" | "criado_em">;

export default async function DashboardPage() {
  const sessao = await requireUsuario();
  const supabase = await createClient();

  const [{ data: resumo }, { data: recentes }, config] = await Promise.all([
    supabase.rpc("resumo_dashboard"),
    supabase
      .from("participantes")
      .select("id, nome, cidade, estado, categoria, tipo_pessoa, imagem_url, criado_em")
      .order("criado_em", { ascending: false })
      .limit(5),
    getConfiguracoes(),
  ]);

  const r = (resumo as ResumoDashboard | null) ?? RESUMO_VAZIO;
  const lista = (recentes ?? []) as Recente[];
  const maiorCategoria = Math.max(1, ...r.por_categoria.map((c) => c.total));
  const primeiroNome = sessao.perfil.nome.split(" ")[0];

  return (
    <>
      <Suspense>
        <AvisoUrl />
      </Suspense>

      {/* Boas-vindas */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 bg-gradient-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="lg" mostrarNome={false} />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Olá, {primeiroNome}!</h1>
              <p className="text-sm text-slate-600">
                {config.nome_organizacao} · {ehAdmin(sessao) ? "Administrador" : "Usuário"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/participantes/novo" icone={<UserPlus className="size-4" aria-hidden />}>
              Cadastrar participante
            </ButtonLink>
            <ButtonLink href="/participantes" variante="outline">
              Ver participantes
            </ButtonLink>
          </div>
        </div>
      </Card>

      {/* Indicadores */}
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard titulo="Total de participantes" valor={r.total_participantes} icone={UsersRound} href="/participantes" descricao={`${formatarNumero(r.ultimos_30_dias)} nos últimos 30 dias`} />
        <StatCard titulo="Total de empresas" valor={r.total_empresas} icone={Building2} href="/participantes?tipo=PJ" cor="violet" descricao="Cadastros com CNPJ" />
        <StatCard titulo="Pessoas físicas" valor={r.total_pessoas} icone={UserRound} href="/participantes?tipo=PF" cor="amber" descricao="Cadastros com CPF" />
        <StatCard
          titulo="Total de usuários"
          valor={r.total_usuarios}
          icone={Users}
          href={ehAdmin(sessao) ? "/usuarios" : undefined}
          cor="emerald"
          descricao="Com acesso ao sistema"
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 *:min-w-0">
        {/* Cadastros recentes */}
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Cadastros recentes"
            icone={<CalendarPlus className="size-5" aria-hidden />}
            acoes={
              <Link href="/participantes" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Ver todos <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          {lista.length === 0 ? (
            <CardBody>
              <EmptyState
                icone={<UsersRound className="size-6" aria-hidden />}
                titulo="Nenhum participante ainda"
                descricao="Os cadastros mais recentes aparecerão aqui."
              />
            </CardBody>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lista.map((p) => (
                <li key={p.id}>
                  <Link href={`/participantes/${p.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                    <Avatar nome={p.nome} src={p.imagem_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.nome}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[p.cidade && `${p.cidade}/${p.estado}`, formatarDataHora(p.criado_em)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge className="hidden shrink-0 sm:inline-flex">{p.categoria}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Categorias + geolocalização */}
        <div className="space-y-6">
          <Card>
            <CardHeader titulo="Por categoria" />
            <CardBody>
              {r.por_categoria.length === 0 ? (
                <p className="text-sm text-slate-500">Sem dados ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {r.por_categoria.map((c) => (
                    <li key={c.categoria}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-slate-700">{c.categoria}</span>
                        <span className="font-medium text-slate-900 tabular-nums">{formatarNumero(c.total)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(c.total / maiorCategoria) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-4">
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <MapPinned className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-slate-500">Com localização no mapa</p>
                <p className="text-lg font-semibold text-slate-900 tabular-nums">
                  {formatarNumero(r.com_localizacao)} <span className="text-sm font-normal text-slate-500">de {formatarNumero(r.total_participantes)}</span>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
