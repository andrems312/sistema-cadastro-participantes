import type { Metadata } from "next";
import Link from "next/link";
import { Building, ChevronRight, ImageIcon, PlugZap } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, PageHeader } from "@/components/ui/misc";
import { Logo } from "@/components/layout/logo";
import { OrganizacaoForm } from "@/components/configuracoes/organizacao-form";
import { requireAdmin } from "@/lib/auth/session";
import { publicEnv, serverEnv } from "@/lib/env";
import { getConfiguracoes } from "@/lib/services/configuracoes";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const config = await getConfiguracoes();

  // Somente indica SE cada integração está configurada — nunca exibe valores de chaves.
  const integracoes = [
    { nome: "Supabase (banco, autenticação e storage)", ok: Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey), variavel: "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY" },
    { nome: "Gestão de usuários pelo painel", ok: Boolean(serverEnv.supabaseServiceRoleKey), variavel: "SUPABASE_SERVICE_ROLE_KEY" },
    { nome: "Mapa (OpenStreetMap)", ok: true, variavel: "tile.openstreetmap.org — sem chave" },
    { nome: "Geocodificação de endereços (Nominatim)", ok: true, variavel: serverEnv.geocodingApiUrl },
    { nome: "Consulta de CNPJ", ok: true, variavel: serverEnv.cnpjApiUrl },
    { nome: "Consulta de CEP", ok: true, variavel: serverEnv.cepApiUrl },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader titulo="Configurações" descricao="Identidade visual e status das integrações do sistema." />

      <Card>
        <CardHeader titulo="Organização" icone={<Building className="size-5" aria-hidden />} />
        <CardBody>
          <OrganizacaoForm nomeAtual={config.nome_organizacao} />
        </CardBody>
      </Card>

      <Link href="/configuracoes/logo" className="block rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md">
        <div className="flex items-center gap-4 p-5">
          <span className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <ImageIcon className="size-5" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Logo do sistema</p>
            <p className="text-sm text-slate-500">Enviar, substituir ou remover a logo exibida no login, menu, cabeçalho e dashboard.</p>
          </div>
          <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="sm" mostrarNome={false} className="hidden sm:flex" />
          <ChevronRight className="size-5 text-slate-400" aria-hidden />
        </div>
      </Link>

      <Card>
        <CardHeader
          titulo="Integrações"
          descricao="Configuradas por variáveis de ambiente no servidor (arquivo .env.local ou painel da hospedagem)."
          icone={<PlugZap className="size-5" aria-hidden />}
        />
        <ul className="divide-y divide-slate-100">
          {integracoes.map((i) => (
            <li key={i.nome} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{i.nome}</p>
                <p className="text-xs break-all text-slate-500">{i.variavel}</p>
              </div>
              <Badge tom={i.ok ? "sucesso" : "alerta"} className="self-start sm:self-auto">
                {i.ok ? "Configurado" : "Não configurado"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
