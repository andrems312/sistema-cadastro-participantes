import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Usuario } from "@/types/database";

export interface Sessao {
  user: User;
  perfil: Usuario;
}

/** Usuário autenticado + perfil (memoizado por requisição). */
export const getSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil, error } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
  if (error || !perfil) {
    throw new Error(
      "Perfil de usuário não encontrado. Verifique se a migração do banco de dados foi aplicada (veja o README).",
    );
  }
  return { user, perfil: perfil as Usuario };
});

/** Para páginas privadas: redireciona ao login se não houver sessão. */
export async function requireUsuario(): Promise<Sessao> {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

/** Para páginas administrativas: bloqueia usuários comuns. */
export async function requireAdmin(): Promise<Sessao> {
  const sessao = await requireUsuario();
  if (sessao.perfil.tipo_acesso !== "admin") redirect("/dashboard?erro=permissao");
  return sessao;
}

export function ehAdmin(sessao: Sessao | null): boolean {
  return sessao?.perfil.tipo_acesso === "admin";
}
