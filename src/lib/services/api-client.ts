/**
 * Chamadas do navegador para as rotas de API internas (/api/*).
 * As chaves de serviços externos ficam apenas no servidor.
 */
import type { DadosCnpj } from "@/lib/services/cnpj";
import type { DadosCep } from "@/lib/services/cep";
import type { PartesEndereco, ResultadoGeocodificacao } from "@/lib/services/geocoding";

export class ErroApi extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly aguardarSegundos?: number,
  ) {
    super(message);
  }
}

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(url, init);
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique sua internet.", 0);
  }
  if (resposta.status === 204) return undefined as T;
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroApi(corpo.erro ?? "Erro inesperado.", resposta.status, corpo.aguardarSegundos);
  }
  return corpo as T;
}

export async function buscarCnpj(cnpj: string): Promise<DadosCnpj> {
  const { dados } = await requisitar<{ dados: DadosCnpj }>(`/api/cnpj/${cnpj}`);
  return dados;
}

export async function buscarCep(cep: string): Promise<DadosCep> {
  const { dados } = await requisitar<{ dados: DadosCep }>(`/api/cep/${cep}`);
  return dados;
}

export async function geocodificar(partes: PartesEndereco): Promise<ResultadoGeocodificacao> {
  const params = new URLSearchParams();
  for (const campo of ["endereco", "numero", "bairro", "cidade", "estado", "cep"] as const) {
    const valor = partes[campo];
    if (valor) params.set(campo, valor);
  }
  const { resultado } = await requisitar<{ resultado: ResultadoGeocodificacao }>(`/api/geocode?${params}`);
  return resultado;
}

export async function enviarImagem(arquivo: File, destino: "participante" | "logo") {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("destino", destino);
  return requisitar<{ path: string; url: string }>("/api/upload", { method: "POST", body: form });
}

export async function descartarImagem(path: string) {
  try {
    await requisitar<void>(`/api/upload?path=${encodeURIComponent(path)}`, { method: "DELETE" });
  } catch {
    // limpeza best-effort
  }
}
