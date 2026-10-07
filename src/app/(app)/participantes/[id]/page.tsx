import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, Badge } from "@/components/ui/misc";
import { ExcluirParticipante } from "@/components/participantes/excluir-participante";
import { LocationMap } from "@/components/participantes/location-map";
import { ehAdmin, requireUsuario } from "@/lib/auth/session";
import { nomesUsuarios, obterParticipante } from "@/lib/services/participantes";
import { formatarDataHora, linkMapa, montarEndereco } from "@/lib/utils/format";
import { formatarCEP, formatarDocumento, formatarTelefone } from "@/lib/utils/masks";

export const metadata: Metadata = { title: "Detalhes do participante" };

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{rotulo}</dt>
      <dd className="mt-1 text-sm break-words text-slate-900">{children || "—"}</dd>
    </div>
  );
}

export default async function ParticipantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sessao, p] = await Promise.all([requireUsuario(), obterParticipante(id)]);
  if (!p) notFound();

  const admin = ehAdmin(sessao);
  const nomes = await nomesUsuarios([p.criado_por, p.atualizado_por]);
  const endereco = montarEndereco(p);
  const temCoordenadas = p.latitude !== null && p.longitude !== null;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/participantes" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para participantes
      </Link>

      {/* Cabeçalho */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar nome={p.nome} src={p.imagem_url} tamanho="xl" className="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tom={p.tipo_pessoa === "PJ" ? "marca" : "neutro"}>{p.tipo_pessoa === "PJ" ? "Pessoa jurídica" : "Pessoa física"}</Badge>
              <Badge>{p.categoria}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight break-words text-slate-900">{p.nome}</h1>
            {p.nome_fantasia && <p className="text-slate-500">{p.nome_fantasia}</p>}
            <p className="mt-1 text-sm text-slate-600 tabular-nums">
              {p.tipo_pessoa === "PJ" ? "CNPJ" : "CPF"}: {formatarDocumento(p.cpf_cnpj)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col">
            <ButtonLink href={`/participantes/${p.id}/editar`} icone={<Pencil className="size-4" aria-hidden />}>
              Editar
            </ButtonLink>
            {admin && <ExcluirParticipante id={p.id} nome={p.nome} redirecionarPara="/participantes" />}
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5 *:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader titulo="Contato" />
            <CardBody>
              <dl className="grid gap-4">
                <Item rotulo="E-mail">
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-brand-700 hover:underline">
                      <Mail className="size-4" aria-hidden /> {p.email}
                    </a>
                  )}
                </Item>
                <Item rotulo="Telefone">
                  {p.telefone && (
                    <a href={`tel:+55${p.telefone}`} className="inline-flex items-center gap-1.5 text-brand-700 hover:underline">
                      <Phone className="size-4" aria-hidden /> {formatarTelefone(p.telefone)}
                    </a>
                  )}
                </Item>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader titulo="Endereço" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Item rotulo="Logradouro">{[p.endereco, p.numero].filter(Boolean).join(", ")}</Item>
                </div>
                <Item rotulo="Complemento">{p.complemento}</Item>
                <Item rotulo="Bairro">{p.bairro}</Item>
                <Item rotulo="Cidade">{p.cidade}</Item>
                <Item rotulo="Estado">{p.estado}</Item>
                <Item rotulo="CEP">{p.cep ? formatarCEP(p.cep) : null}</Item>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader titulo="Registro" />
            <CardBody>
              <dl className="grid gap-4">
                <Item rotulo="Cadastrado em">
                  {formatarDataHora(p.criado_em)}
                  {p.criado_por && nomes[p.criado_por] && <span className="text-slate-500"> · por {nomes[p.criado_por]}</span>}
                </Item>
                <Item rotulo="Última atualização">
                  {formatarDataHora(p.atualizado_em)}
                  {p.atualizado_por && nomes[p.atualizado_por] && <span className="text-slate-500"> · por {nomes[p.atualizado_por]}</span>}
                </Item>
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader
              titulo="Localização"
              icone={<MapPin className="size-5" aria-hidden />}
              acoes={
                temCoordenadas && (
                  <a
                    href={linkMapa(p.latitude!, p.longitude!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                  >
                    Abrir no OpenStreetMap <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )
              }
            />
            <CardBody className="space-y-3">
              <LocationMap latitude={p.latitude} longitude={p.longitude} titulo={p.nome} />
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">Endereço: </span>
                {endereco || "não informado"}
              </p>
              {!temCoordenadas && (
                <p className="text-xs text-amber-700">
                  Localização ainda não definida. Edite o participante e use “Localizar no mapa”.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader titulo="Observações" />
            <CardBody>
              <p className="text-sm whitespace-pre-line text-slate-700">{p.observacoes || "Nenhuma observação."}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
