import "server-only";
import { serverEnv } from "@/lib/env";
import { somenteDigitos } from "@/lib/validations/documentos";

export interface DadosCep {
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface RespostaCep {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
}

const cache = new Map<string, { expira: number; dados: DadosCep }>();
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Retorna null quando o CEP não existe. Lança erro quando o serviço falha. */
export async function consultarCep(cepEntrada: string): Promise<DadosCep | null> {
  const cep = somenteDigitos(cepEntrada);
  const emCache = cache.get(cep);
  if (emCache && emCache.expira > Date.now()) return emCache.dados;

  const resposta = await fetch(`${serverEnv.cepApiUrl}/${cep}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (resposta.status === 404 || resposta.status === 400) return null;
  if (!resposta.ok) throw new Error("Falha no serviço de CEP");

  const d = (await resposta.json()) as RespostaCep;
  const dados: DadosCep = {
    cep,
    endereco: d.street ?? "",
    bairro: d.neighborhood ?? "",
    cidade: d.city ?? "",
    estado: (d.state ?? "").toUpperCase(),
  };
  cache.set(cep, { expira: Date.now() + TTL_MS, dados });
  return dados;
}
