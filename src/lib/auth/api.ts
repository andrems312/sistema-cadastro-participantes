import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TipoAcesso } from "@/types/database";

/** Resposta JSON de erro padronizada para as rotas de API. */
export function erroJson(mensagem: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ erro: mensagem, ...extra }, { status });
}

/**
 * Autentica a requisição de uma Route Handler (cookies da sessão).
 * Retorna o cliente Supabase do usuário (RLS ativo), o usuário e o nível de acesso.
 */
export async function autenticarApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from("usuarios").select("tipo_acesso").eq("id", user.id).single();
  const tipo = (perfil?.tipo_acesso ?? "usuario") as TipoAcesso;
  return { supabase, user, tipo };
}
