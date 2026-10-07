/**
 * Tipos das tabelas do banco (espelham supabase/migrations).
 * Dica: em projetos maiores, gere automaticamente com
 *   npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
 */

export type TipoAcesso = "admin" | "usuario";
export type TipoPessoa = "PF" | "PJ";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo_acesso: TipoAcesso;
  tipo_solicitado: TipoAcesso;
  criado_em: string;
  atualizado_em: string;
}

export interface Participante {
  id: string;
  cpf_cnpj: string;
  tipo_pessoa: TipoPessoa;
  nome: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  categoria: string;
  latitude: number | null;
  longitude: number | null;
  imagem_url: string | null;
  imagem_path: string | null;
  observacoes: string | null;
  criado_por: string | null;
  atualizado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Configuracoes {
  id: number;
  nome_organizacao: string;
  logo_url: string | null;
  logo_path: string | null;
  atualizado_por: string | null;
  atualizado_em: string;
}

export interface ResumoDashboard {
  total_participantes: number;
  total_empresas: number;
  total_pessoas: number;
  total_usuarios: number;
  com_localizacao: number;
  ultimos_30_dias: number;
  por_categoria: { categoria: string; total: number }[];
}

/** Estado usado por formulários com useActionState. */
export interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  valores?: Record<string, string>;
}

/** Resultado padrão das server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
