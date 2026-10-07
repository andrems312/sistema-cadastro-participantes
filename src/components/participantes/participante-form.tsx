"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Save,
  Search,
  XCircle,
} from "lucide-react";
import { salvarParticipante } from "@/actions/participantes";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/misc";
import { ImageUpload } from "@/components/participantes/image-upload";
import { LocationMap } from "@/components/participantes/location-map";
import { CATEGORIAS, SIGLAS_UF, UFS } from "@/lib/constants";
import { buscarCep, buscarCnpj, descartarImagem, enviarImagem, ErroApi, geocodificar } from "@/lib/services/api-client";
import { cn } from "@/lib/utils/cn";
import { linkMapa, montarEndereco } from "@/lib/utils/format";
import { mascaraCEP, mascaraCpfCnpj, mascaraTelefone } from "@/lib/utils/masks";
import { errosPorCampo } from "@/lib/validations/auth";
import { somenteDigitos, validarCNPJ } from "@/lib/validations/documentos";
import { participanteSchema } from "@/lib/validations/participante";
import type { Participante } from "@/types/database";

interface Valores {
  cpf_cnpj: string;
  nome: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  categoria: string;
  observacoes: string;
  latitude: number | null;
  longitude: number | null;
}

type CampoTexto = Exclude<keyof Valores, "latitude" | "longitude">;
type Status = { tipo: "info" | "sucesso" | "erro"; mensagem: string } | null;

const CAMPOS_ENDERECO: CampoTexto[] = ["cep", "endereco", "numero", "bairro", "cidade", "estado"];
const ESPERA_ENTRE_CONSULTAS_S = 5;

function valoresIniciais(p?: Participante | null): Valores {
  return {
    cpf_cnpj: p ? mascaraCpfCnpj(p.cpf_cnpj) : "",
    nome: p?.nome ?? "",
    nome_fantasia: p?.nome_fantasia ?? "",
    email: p?.email ?? "",
    telefone: p?.telefone ? mascaraTelefone(p.telefone) : "",
    cep: p?.cep ? mascaraCEP(p.cep) : "",
    endereco: p?.endereco ?? "",
    numero: p?.numero ?? "",
    complemento: p?.complemento ?? "",
    bairro: p?.bairro ?? "",
    cidade: p?.cidade ?? "",
    estado: p?.estado ?? "",
    categoria: p?.categoria ?? "",
    observacoes: p?.observacoes ?? "",
    latitude: p?.latitude ?? null,
    longitude: p?.longitude ?? null,
  };
}

export function ParticipanteForm({ participante }: { participante?: Participante | null }) {
  const router = useRouter();
  const edicao = Boolean(participante);

  const [v, setV] = useState<Valores>(() => valoresIniciais(participante));
  const valoresRef = useRef(v);
  valoresRef.current = v;

  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Imagem
  const [imagemPath, setImagemPath] = useState<string | null>(participante?.imagem_path ?? null);
  const [imagemUrl, setImagemUrl] = useState<string | null>(participante?.imagem_url ?? null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroImagem, setErroImagem] = useState<string | undefined>();

  // CNPJ
  const [statusCnpj, setStatusCnpj] = useState<Status>(null);
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [espera, setEspera] = useState(0);
  const ultimoCnpj = useRef<string | null>(null);

  // CEP
  const [consultandoCep, setConsultandoCep] = useState(false);
  const ultimoCep = useRef<string | null>(participante?.cep ?? null);

  // Mapa
  const [localizando, setLocalizando] = useState(false);
  const [enderecoEncontrado, setEnderecoEncontrado] = useState<string | null>(null);
  const [coordDesatualizada, setCoordDesatualizada] = useState(false);

  const documento = somenteDigitos(v.cpf_cnpj);
  const tipoPessoa = documento.length === 11 ? "PF" : documento.length > 11 ? "PJ" : null;
  const cnpjCompleto = documento.length === 14;
  const cnpjValido = cnpjCompleto && validarCNPJ(documento);

  // Contagem regressiva entre consultas de CNPJ (evita consultas em excesso)
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  function limparErro(campo: string) {
    setErros((e) => {
      if (!e[campo]) return e;
      const resto = { ...e };
      delete resto[campo];
      return resto;
    });
  }

  function alterar(campo: CampoTexto, valor: string) {
    setV((atual) => ({ ...atual, [campo]: valor }));
    limparErro(campo);
    if (CAMPOS_ENDERECO.includes(campo) && valoresRef.current.latitude !== null) {
      setCoordDesatualizada(true);
    }
  }

  /* ----------------------------- CNPJ ----------------------------- */
  async function consultarCnpj() {
    if (consultandoCnpj || espera > 0) return;
    if (!validarCNPJ(documento)) {
      setStatusCnpj({ tipo: "erro", mensagem: "CNPJ inválido" });
      return;
    }
    if (ultimoCnpj.current === documento) {
      setStatusCnpj({ tipo: "info", mensagem: "Este CNPJ já foi consultado — os dados já estão no formulário." });
      return;
    }

    setConsultandoCnpj(true);
    setStatusCnpj({ tipo: "info", mensagem: "Consultando CNPJ..." });
    try {
      const d = await buscarCnpj(documento);
      ultimoCnpj.current = documento;
      const base = valoresRef.current;
      const novo: Valores = {
        ...base,
        nome: d.razao_social || base.nome,
        nome_fantasia: d.nome_fantasia || base.nome_fantasia,
        email: base.email || d.email,
        telefone: base.telefone || (d.telefone ? mascaraTelefone(d.telefone) : ""),
        cep: d.cep ? mascaraCEP(d.cep) : base.cep,
        endereco: d.endereco || base.endereco,
        numero: d.numero || base.numero,
        complemento: d.complemento || base.complemento,
        bairro: d.bairro || base.bairro,
        cidade: d.cidade || base.cidade,
        estado: SIGLAS_UF.includes(d.estado) ? d.estado : base.estado,
        categoria: base.categoria || "Empresa",
      };
      if (d.cep) ultimoCep.current = d.cep;
      setV(novo);
      setErros({});
      const situacao = d.situacao ? ` · Situação cadastral: ${d.situacao}` : "";
      setStatusCnpj({ tipo: "sucesso", mensagem: `CNPJ encontrado com sucesso${situacao}` });
      toast.success("CNPJ encontrado com sucesso");
      void localizar(novo, true);
    } catch (e) {
      const erro = e instanceof ErroApi ? e : new ErroApi("Erro ao consultar serviço", 500);
      const mensagem =
        erro.status === 404
          ? "CNPJ não encontrado"
          : erro.status === 400
            ? "CNPJ inválido"
            : erro.status === 429 || erro.status === 401
              ? erro.message
              : "Erro ao consultar serviço";
      if (erro.status === 404) ultimoCnpj.current = documento; // não repetir consulta de CNPJ inexistente
      setStatusCnpj({ tipo: "erro", mensagem });
      toast.error(erro.status === 404 || erro.status === 400 ? mensagem : "Erro ao consultar o CNPJ.");
    } finally {
      setConsultandoCnpj(false);
      setEspera(ESPERA_ENTRE_CONSULTAS_S);
    }
  }

  /* ----------------------------- CEP ----------------------------- */
  function alterarCep(valor: string) {
    const mascarado = mascaraCEP(valor);
    alterar("cep", mascarado);
    const cep = somenteDigitos(mascarado);
    if (cep.length === 8 && cep !== ultimoCep.current) void consultarCep(cep);
  }

  async function consultarCep(cep: string) {
    ultimoCep.current = cep;
    setConsultandoCep(true);
    try {
      const d = await buscarCep(cep);
      const base = valoresRef.current;
      const novo: Valores = {
        ...base,
        endereco: d.endereco || base.endereco,
        bairro: d.bairro || base.bairro,
        cidade: d.cidade || base.cidade,
        estado: SIGLAS_UF.includes(d.estado) ? d.estado : base.estado,
      };
      setV(novo);
      ["endereco", "bairro", "cidade", "estado"].forEach(limparErro);
      toast.success("Endereço preenchido pelo CEP.");
      document.getElementById("numero")?.focus();
      void localizar(novo, true);
    } catch (e) {
      if (e instanceof ErroApi && e.status === 404) setErros((er) => ({ ...er, cep: "CEP não encontrado." }));
      else toast.error("Erro ao consultar o CEP. Preencha o endereço manualmente.");
    } finally {
      setConsultandoCep(false);
    }
  }

  /* ----------------------------- MAPA ----------------------------- */
  async function localizar(valores: Valores = valoresRef.current, automatico = false) {
    if (!valores.cidade || !valores.estado) {
      if (!automatico) toast.error("Informe ao menos a cidade e o estado para localizar no mapa.");
      return null;
    }
    setLocalizando(true);
    try {
      const r = await geocodificar(valores);
      setV((atual) => ({ ...atual, latitude: r.latitude, longitude: r.longitude }));
      setEnderecoEncontrado(r.aproximado ? `${r.endereco_formatado} (aproximado — arraste o marcador para ajustar)` : r.endereco_formatado);
      setCoordDesatualizada(false);
      if (!automatico) {
        if (r.aproximado) toast.info("Endereço exato não encontrado: localização aproximada. Arraste o marcador para ajustar.");
        else toast.success("Endereço localizado no mapa.");
      }
      return r;
    } catch (e) {
      if (!automatico) toast.error(e instanceof ErroApi ? e.message : "Não foi possível localizar o endereço.");
      return null;
    } finally {
      setLocalizando(false);
    }
  }

  function moverMarcador(latitude: number, longitude: number) {
    setV((atual) => ({ ...atual, latitude, longitude }));
    setEnderecoEncontrado("Posição ajustada manualmente no mapa");
    setCoordDesatualizada(false);
  }

  /* ----------------------------- SALVAR ----------------------------- */
  async function aoSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;

    const validacao = participanteSchema.safeParse({ ...v, imagem_path: imagemPath });
    if (!validacao.success) {
      const fe = errosPorCampo(validacao.error);
      setErros(fe);
      toast.error("Revise os campos destacados.");
      document.getElementById(Object.keys(fe)[0])?.focus();
      return;
    }

    setSalvando(true);
    let enviado: string | null = null;
    try {
      let { latitude, longitude } = v;
      if (coordDesatualizada) {
        const r = await localizar(v, true);
        if (r) {
          latitude = r.latitude;
          longitude = r.longitude;
        }
      }

      let path = imagemPath;
      if (arquivo) {
        const up = await enviarImagem(arquivo, "participante");
        enviado = up.path;
        path = up.path;
        toast.success("Imagem enviada com sucesso.");
      }

      const resultado = await salvarParticipante(participante?.id ?? null, { ...v, latitude, longitude, imagem_path: path });
      if (!resultado.ok) {
        if (enviado) await descartarImagem(enviado);
        setErros(resultado.fieldErrors ?? {});
        toast.error(resultado.message);
        const primeiro = Object.keys(resultado.fieldErrors ?? {})[0];
        if (primeiro) document.getElementById(primeiro)?.focus();
        return;
      }

      setArquivo(null);
      toast.success(resultado.message);
      if (resultado.data?.geocodificado) toast.info("Localização definida automaticamente a partir do endereço.");
      router.push(`/participantes/${resultado.data!.id}`);
      router.refresh();
    } catch (err) {
      if (enviado) await descartarImagem(enviado);
      toast.error(err instanceof ErroApi ? err.message : "Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const rotuloNome = tipoPessoa === "PF" ? "Nome completo" : tipoPessoa === "PJ" ? "Razão Social" : "Nome completo / Razão Social";
  const temCoordenadas = v.latitude !== null && v.longitude !== null;

  return (
    <form onSubmit={aoSalvar} noValidate className="space-y-6 pb-24 sm:pb-0">
      {/* ------------------------- DADOS ------------------------- */}
      <Card>
        <CardHeader
          titulo="Dados do participante/empresa"
          descricao="Informe o CPF (pessoa física) ou CNPJ (empresa). Para CNPJ, use a consulta automática."
          icone={<Building2 className="size-5" aria-hidden />}
          acoes={tipoPessoa && <Badge tom="marca">{tipoPessoa === "PJ" ? "Pessoa jurídica" : "Pessoa física"}</Badge>}
        />
        <CardBody className="grid gap-5 sm:grid-cols-6">
          <Field
            id="cpf_cnpj"
            label="CPF ou CNPJ"
            erro={erros.cpf_cnpj}
            obrigatorio
            className="sm:col-span-6 lg:col-span-4"
            dica={cnpjCompleto && !cnpjValido ? undefined : "Digite apenas os números — a máscara é aplicada automaticamente."}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="cpf_cnpj"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={v.cpf_cnpj}
                onChange={(e) => {
                  alterar("cpf_cnpj", mascaraCpfCnpj(e.target.value));
                  setStatusCnpj(null);
                }}
                erro={erros.cpf_cnpj}
                maxLength={18}
                className="sm:flex-1"
              />
              {cnpjCompleto && (
                <Button
                  variante="secondary"
                  onClick={consultarCnpj}
                  carregando={consultandoCnpj}
                  disabled={!cnpjValido || espera > 0}
                  icone={<Search className="size-4" aria-hidden />}
                  className="shrink-0"
                >
                  {consultandoCnpj ? "Consultando..." : espera > 0 ? `Aguarde ${espera}s` : "Consultar CNPJ"}
                </Button>
              )}
            </div>
            {cnpjCompleto && !cnpjValido && !erros.cpf_cnpj && (
              <p className="flex items-center gap-1.5 text-sm text-red-600" role="alert">
                <XCircle className="size-4" aria-hidden /> CNPJ inválido
              </p>
            )}
            {statusCnpj && (
              <p
                role="status"
                aria-live="polite"
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  statusCnpj.tipo === "sucesso" && "text-emerald-700",
                  statusCnpj.tipo === "erro" && "text-red-600",
                  statusCnpj.tipo === "info" && "text-slate-600",
                )}
              >
                {statusCnpj.tipo === "sucesso" && <CheckCircle2 className="size-4" aria-hidden />}
                {statusCnpj.tipo === "erro" && <XCircle className="size-4" aria-hidden />}
                {statusCnpj.tipo === "info" &&
                  (consultandoCnpj ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Info className="size-4" aria-hidden />)}
                {statusCnpj.mensagem}
              </p>
            )}
          </Field>

          <Field id="categoria" label="Categoria" erro={erros.categoria} obrigatorio className="sm:col-span-6 lg:col-span-2">
            <Select id="categoria" value={v.categoria} onChange={(e) => alterar("categoria", e.target.value)} erro={erros.categoria}>
              <option value="">Selecione...</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="nome" label={rotuloNome} erro={erros.nome} obrigatorio className="sm:col-span-6 lg:col-span-4">
            <Input id="nome" value={v.nome} onChange={(e) => alterar("nome", e.target.value)} erro={erros.nome} maxLength={200} autoComplete="off" />
          </Field>

          <Field id="nome_fantasia" label="Nome fantasia" erro={erros.nome_fantasia} className="sm:col-span-6 lg:col-span-2">
            <Input
              id="nome_fantasia"
              value={v.nome_fantasia}
              onChange={(e) => alterar("nome_fantasia", e.target.value)}
              erro={erros.nome_fantasia}
              maxLength={200}
            />
          </Field>

          <Field id="email" label="E-mail" erro={erros.email} className="sm:col-span-3">
            <Input
              id="email"
              type="email"
              inputMode="email"
              value={v.email}
              onChange={(e) => alterar("email", e.target.value)}
              erro={erros.email}
              placeholder="contato@empresa.com"
              maxLength={200}
            />
          </Field>

          <Field id="telefone" label="Telefone" erro={erros.telefone} className="sm:col-span-3">
            <Input
              id="telefone"
              type="tel"
              inputMode="tel"
              value={v.telefone}
              onChange={(e) => alterar("telefone", mascaraTelefone(e.target.value))}
              erro={erros.telefone}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </Field>
        </CardBody>
      </Card>

      {/* ------------------------- ENDEREÇO ------------------------- */}
      <Card>
        <CardHeader titulo="Endereço" descricao="Ao informar o CEP, o endereço é preenchido automaticamente." icone={<MapPin className="size-5" aria-hidden />} />
        <CardBody className="grid gap-5 sm:grid-cols-6">
          <Field id="cep" label="CEP" erro={erros.cep} className="sm:col-span-2" dica={consultandoCep ? "Buscando endereço..." : undefined}>
            <div className="relative">
              <Input
                id="cep"
                inputMode="numeric"
                value={v.cep}
                onChange={(e) => alterarCep(e.target.value)}
                erro={erros.cep}
                placeholder="00000-000"
                maxLength={9}
              />
              {consultandoCep && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />}
            </div>
          </Field>
          <Field id="endereco" label="Endereço" erro={erros.endereco} className="sm:col-span-4">
            <Input id="endereco" value={v.endereco} onChange={(e) => alterar("endereco", e.target.value)} erro={erros.endereco} placeholder="Rua, avenida..." maxLength={200} />
          </Field>
          <Field id="numero" label="Número" erro={erros.numero} className="sm:col-span-2">
            <Input id="numero" value={v.numero} onChange={(e) => alterar("numero", e.target.value)} erro={erros.numero} maxLength={20} />
          </Field>
          <Field id="complemento" label="Complemento" erro={erros.complemento} className="sm:col-span-4">
            <Input id="complemento" value={v.complemento} onChange={(e) => alterar("complemento", e.target.value)} erro={erros.complemento} placeholder="Sala, andar, bloco..." maxLength={100} />
          </Field>
          <Field id="bairro" label="Bairro" erro={erros.bairro} className="sm:col-span-2">
            <Input id="bairro" value={v.bairro} onChange={(e) => alterar("bairro", e.target.value)} erro={erros.bairro} maxLength={100} />
          </Field>
          <Field id="cidade" label="Cidade" erro={erros.cidade} obrigatorio className="sm:col-span-2">
            <Input id="cidade" value={v.cidade} onChange={(e) => alterar("cidade", e.target.value)} erro={erros.cidade} maxLength={100} />
          </Field>
          <Field id="estado" label="Estado" erro={erros.estado} obrigatorio className="sm:col-span-2">
            <Select id="estado" value={v.estado} onChange={(e) => alterar("estado", e.target.value)} erro={erros.estado}>
              <option value="">Selecione...</option>
              {UFS.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>
                  {uf.sigla} — {uf.nome}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {/* ------------------------- LOCALIZAÇÃO ------------------------- */}
      <Card>
        <CardHeader
          titulo="Localização"
          descricao="Localize o endereço no mapa. Se necessário, arraste o marcador para ajustar a posição."
          icone={<LocateFixed className="size-5" aria-hidden />}
          acoes={
            <Button
              variante="outline"
              tamanho="sm"
              onClick={() => localizar(valoresRef.current, false)}
              carregando={localizando}
              icone={<LocateFixed className="size-4" aria-hidden />}
            >
              {localizando ? "Localizando..." : "Localizar no mapa"}
            </Button>
          }
        />
        <CardBody className="space-y-3">
          <LocationMap latitude={v.latitude} longitude={v.longitude} onMover={moverMarcador} titulo={v.nome || undefined} />
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600">
              {temCoordenadas ? (
                <>
                  <span className="font-medium text-slate-800">Endereço encontrado: </span>
                  {enderecoEncontrado ?? montarEndereco(v)}
                  <span className="block text-xs text-slate-500">
                    Lat {v.latitude!.toFixed(6)} · Lng {v.longitude!.toFixed(6)}
                  </span>
                </>
              ) : (
                <span>Nenhuma localização definida. Ao salvar, o sistema tenta localizar o endereço automaticamente.</span>
              )}
              {coordDesatualizada && (
                <span className="mt-1 block text-xs text-amber-700">
                  O endereço foi alterado — a localização será atualizada ao salvar (ou clique em “Localizar no mapa”).
                </span>
              )}
            </div>
            {temCoordenadas && (
              <a
                href={linkMapa(v.latitude!, v.longitude!)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
              >
                Abrir no OpenStreetMap <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ------------------------- IMAGEM + OBS ------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Imagem" icone={<ImageIcon className="size-5" aria-hidden />} />
          <CardBody>
            <ImageUpload
              urlAtual={imagemUrl}
              arquivo={arquivo}
              erro={erroImagem}
              onErro={(m) => {
                setErroImagem(m);
                toast.error(m);
              }}
              onSelecionar={(f) => {
                setArquivo(f);
                setErroImagem(undefined);
              }}
              onRemover={() => {
                setImagemPath(null);
                setImagemUrl(null);
                setArquivo(null);
                toast.info("A imagem será removida ao salvar.");
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Observações" icone={<FileText className="size-5" aria-hidden />} />
          <CardBody>
            <Field id="observacoes" label="Observações" erro={erros.observacoes} dica={`${v.observacoes.length}/2000 caracteres`}>
              <Textarea
                id="observacoes"
                rows={5}
                value={v.observacoes}
                onChange={(e) => alterar("observacoes", e.target.value)}
                erro={erros.observacoes}
                maxLength={2000}
              />
            </Field>
          </CardBody>
        </Card>
      </div>

      {/* ------------------------- AÇÕES ------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <Link
          href={edicao ? `/participantes/${participante!.id}` : "/participantes"}
          className={buttonClasses("outline", "lg", "flex-1 sm:flex-none")}
          aria-disabled={salvando}
        >
          Cancelar
        </Link>
        <Button type="submit" tamanho="lg" carregando={salvando} icone={<Save className="size-4" aria-hidden />} className="flex-1 sm:flex-none">
          {salvando ? "Salvando..." : edicao ? "Salvar alterações" : "Cadastrar participante"}
        </Button>
      </div>
    </form>
  );
}
