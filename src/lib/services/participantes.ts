import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ITENS_POR_PAGINA, SIGLAS_UF, CATEGORIAS } from "@/lib/constants";
import { sanitizarBusca } from "@/lib/utils/texto";
import { somenteDigitos } from "@/lib/validations/documentos";
import type { Participante } from "@/types/database";

export interface FiltrosParticipantes {
  q?: string;
  categoria?: string;
  estado?: string;
  tipo?: string;
  ordem?: string;
  pagina?: string;
}

export type ParticipanteResumo = Pick<
  Participante,
  "id" | "nome" | "nome_fantasia" | "cpf_cnpj" | "tipo_pessoa" | "cidade" | "estado" | "categoria" | "imagem_url" | "email" | "telefone" | "criado_em"
>;

const COLUNAS_LISTA =
  "id, nome, nome_fantasia, cpf_cnpj, tipo_pessoa, cidade, estado, categoria, imagem_url, email, telefone, criado_em";

/** Busca paginada com pesquisa por nome, razão social, nome fantasia, CPF/CNPJ e cidade. */
export async function listarParticipantes(filtros: FiltrosParticipantes) {
  const supabase = await createClient();
  const pagina = Math.max(1, Number.parseInt(filtros.pagina ?? "1", 10) || 1);
  const inicio = (pagina - 1) * ITENS_POR_PAGINA;

  let query = supabase.from("participantes").select(COLUNAS_LISTA, { count: "exact" });

  const termo = sanitizarBusca(filtros.q);
  if (termo) {
    const padrao = `%${termo}%`;
    const condicoes = [
      `nome.ilike.${padrao}`,
      `razao_social.ilike.${padrao}`,
      `nome_fantasia.ilike.${padrao}`,
      `cidade.ilike.${padrao}`,
    ];
    const digitos = somenteDigitos(termo);
    if (digitos.length >= 3) condicoes.push(`cpf_cnpj.ilike.%${digitos}%`);
    query = query.or(condicoes.join(","));
  }

  if (filtros.categoria && (CATEGORIAS as readonly string[]).includes(filtros.categoria)) {
    query = query.eq("categoria", filtros.categoria);
  }
  if (filtros.estado && SIGLAS_UF.includes(filtros.estado)) query = query.eq("estado", filtros.estado);
  if (filtros.tipo === "PF" || filtros.tipo === "PJ") query = query.eq("tipo_pessoa", filtros.tipo);

  switch (filtros.ordem) {
    case "nome":
      query = query.order("nome", { ascending: true });
      break;
    case "antigos":
      query = query.order("criado_em", { ascending: true });
      break;
    default:
      query = query.order("criado_em", { ascending: false });
  }

  const { data, count, error } = await query.range(inicio, inicio + ITENS_POR_PAGINA - 1);
  if (error) throw new Error(`Erro ao carregar participantes: ${error.message}`);

  const total = count ?? 0;
  return {
    itens: (data ?? []) as ParticipanteResumo[],
    total,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)),
  };
}

export async function obterParticipante(id: string): Promise<Participante | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("participantes").select("*").eq("id", id).maybeSingle();
  return (data as Participante | null) ?? null;
}

/** Nome de quem cadastrou/alterou (visível conforme RLS: o próprio usuário ou admin). */
export async function nomesUsuarios(ids: (string | null)[]): Promise<Record<string, string>> {
  const validos = [...new Set(ids.filter((i): i is string => Boolean(i)))];
  if (!validos.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("usuarios").select("id, nome").in("id", validos);
  return Object.fromEntries((data ?? []).map((u) => [u.id, u.nome]));
}
