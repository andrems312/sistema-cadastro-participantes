import "server-only";
import { serverEnv } from "@/lib/env";
import { capitalizar } from "@/lib/utils/texto";
import { somenteDigitos } from "@/lib/validations/documentos";

/** Dados de CNPJ já normalizados para o formulário de participante. */
export interface DadosCnpj {
  cnpj: string;
  razao_social: string;
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
  situacao: string;
  atividade_principal: string;
}

export class ErroConsultaCnpj extends Error {
  constructor(
    message: string,
    public readonly status: 404 | 502 | 504,
  ) {
    super(message);
  }
}

/** Resposta da BrasilAPI (campos usados). */
interface RespostaBrasilApi {
  cnpj?: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  email?: string | null;
  ddd_telefone_1?: string | null;
  cep?: string | number | null;
  descricao_tipo_de_logradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  descricao_situacao_cadastral?: string | null;
  cnae_fiscal_descricao?: string | null;
}

// Cache em memória: evita consultar a API pública repetidamente para o mesmo CNPJ.
const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { expira: number; dados: DadosCnpj }>();

export async function consultarCnpj(cnpjEntrada: string): Promise<DadosCnpj> {
  const cnpj = somenteDigitos(cnpjEntrada);
  const emCache = cache.get(cnpj);
  if (emCache && emCache.expira > Date.now()) return emCache.dados;

  let resposta: Response;
  try {
    resposta = await fetch(`${serverEnv.cnpjApiUrl}/${cnpj}`, {
      headers: { Accept: "application/json", "User-Agent": "SistemaCadastroParticipantes/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new ErroConsultaCnpj(
      timeout ? "O serviço de CNPJ demorou para responder. Tente novamente." : "Erro ao consultar serviço de CNPJ.",
      timeout ? 504 : 502,
    );
  }

  if (resposta.status === 404 || resposta.status === 400) {
    throw new ErroConsultaCnpj("CNPJ não encontrado.", 404);
  }
  if (!resposta.ok) {
    throw new ErroConsultaCnpj("Erro ao consultar serviço de CNPJ.", 502);
  }

  const d = (await resposta.json()) as RespostaBrasilApi;
  const logradouro = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(" ");
  const telefone = somenteDigitos(d.ddd_telefone_1);

  const dados: DadosCnpj = {
    cnpj,
    razao_social: (d.razao_social ?? "").trim(),
    nome_fantasia: (d.nome_fantasia ?? "").trim(),
    email: (d.email ?? "").trim().toLowerCase(),
    telefone: telefone.length >= 10 && telefone.length <= 11 ? telefone : "",
    cep: somenteDigitos(String(d.cep ?? "")).padStart(8, "0").slice(0, 8),
    endereco: capitalizar(logradouro),
    numero: (d.numero ?? "").trim(),
    complemento: capitalizar(d.complemento),
    bairro: capitalizar(d.bairro),
    cidade: capitalizar(d.municipio),
    estado: (d.uf ?? "").trim().toUpperCase(),
    situacao: capitalizar(d.descricao_situacao_cadastral),
    atividade_principal: d.cnae_fiscal_descricao ?? "",
  };
  if (dados.cep === "00000000") dados.cep = "";

  cache.set(cnpj, { expira: Date.now() + TTL_MS, dados });
  return dados;
}
