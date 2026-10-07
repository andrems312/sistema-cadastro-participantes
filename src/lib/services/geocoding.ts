import "server-only";
import { publicEnv, serverEnv } from "@/lib/env";
import { UFS } from "@/lib/constants";

export interface ResultadoGeocodificacao {
  latitude: number;
  longitude: number;
  endereco_formatado: string;
  /** true quando só foi possível localizar o bairro/cidade, não o endereço exato. */
  aproximado: boolean;
}

export interface PartesEndereco {
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

export class ErroGeocodificacao extends Error {}

interface ResultadoNominatim {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string | undefined>;
}

/** OpenStreetMap (Nominatim) é gratuito e não exige chave: sempre disponível. */
export function geocodificacaoConfigurada(): boolean {
  return true;
}

// Política de uso do Nominatim: no máximo 1 requisição por segundo e User-Agent identificando a aplicação.
const INTERVALO_MS = 1100;
let fila: Promise<unknown> = Promise.resolve();
let ultimaRequisicao = 0;

function enfileirar<T>(tarefa: () => Promise<T>): Promise<T> {
  const execucao = fila.then(async () => {
    const espera = ultimaRequisicao + INTERVALO_MS - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaRequisicao = Date.now();
    return tarefa();
  });
  fila = execucao.catch(() => undefined);
  return execucao;
}

const CACHE_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { expira: number; valor: ResultadoNominatim[] }>();

async function buscar(params: Record<string, string>): Promise<ResultadoNominatim[]> {
  const url = new URL(`${serverEnv.geocodingApiUrl}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("accept-language", "pt-BR");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (serverEnv.geocodingEmail) url.searchParams.set("email", serverEnv.geocodingEmail);

  const chave = url.toString();
  const emCache = cache.get(chave);
  if (emCache && emCache.expira > Date.now()) return emCache.valor;

  const dados = await enfileirar(async () => {
    let resposta: Response;
    try {
      resposta = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": `sistema-cadastro-participantes/1.0 (${publicEnv.siteUrl})` },
      });
    } catch {
      throw new ErroGeocodificacao("Não foi possível conectar ao serviço de mapas (OpenStreetMap).");
    }
    if (resposta.status === 429) throw new ErroGeocodificacao("Serviço de mapas ocupado. Tente novamente em alguns segundos.");
    if (!resposta.ok) throw new ErroGeocodificacao("Erro no serviço de mapas (OpenStreetMap).");
    return (await resposta.json()) as ResultadoNominatim[];
  });

  const valor = Array.isArray(dados) ? dados : [];
  cache.set(chave, { expira: Date.now() + CACHE_MS, valor });
  return valor;
}

function limpar(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function normalizar(v: string | null | undefined): string {
  return (v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Garante que o resultado está na cidade/estado informados (o Nominatim pode devolver homônimos de outras cidades). */
function mesmoLocal(r: ResultadoNominatim, cidade: string, estado: string): boolean {
  const a = r.address ?? {};
  if (cidade) {
    const alvo = normalizar(cidade);
    const candidatos = [a.city, a.town, a.village, a.municipality, a.city_district, a.hamlet].map(normalizar);
    if (!candidatos.includes(alvo)) return false;
  }
  if (estado && a.state && normalizar(a.state) !== normalizar(estado)) return false;
  return true;
}

/**
 * Converte um endereço em latitude/longitude com o OpenStreetMap (Nominatim).
 * Tenta do mais preciso ao menos preciso: rua + número → rua → CEP → bairro → cidade.
 * Retorna null quando nem a cidade é encontrada.
 */
export async function geocodificarEndereco(p: PartesEndereco): Promise<ResultadoGeocodificacao | null> {
  const rua = limpar(p.endereco);
  const numero = limpar(p.numero).replace(/^(s\/?n|sn)$/i, "");
  const bairro = limpar(p.bairro);
  const cidade = limpar(p.cidade);
  const uf = limpar(p.estado).toUpperCase();
  const estado = UFS.find((u) => u.sigla === uf)?.nome ?? uf;
  const cep = limpar(p.cep).replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");

  const base = { country: "Brasil", ...(cidade && { city: cidade }), ...(estado && { state: estado }) };
  const tentativas: { params: Record<string, string>; aproximado: boolean }[] = [];
  if (rua && numero) tentativas.push({ params: { ...base, street: `${numero} ${rua}` }, aproximado: false });
  if (rua) tentativas.push({ params: { ...base, street: rua }, aproximado: false });
  if (cep.length === 9) tentativas.push({ params: { country: "Brasil", postalcode: cep }, aproximado: true });
  if (bairro && cidade) tentativas.push({ params: { q: [bairro, cidade, estado].filter(Boolean).join(", ") }, aproximado: true });
  if (cidade) tentativas.push({ params: base, aproximado: true });

  if (!tentativas.length) return null;

  for (const t of tentativas) {
    const r = (await buscar(t.params)).find((item) => mesmoLocal(item, cidade, estado));
    if (r) {
      return {
        latitude: Number(r.lat),
        longitude: Number(r.lon),
        endereco_formatado: r.display_name,
        aproximado: t.aproximado,
      };
    }
  }
  return null;
}
