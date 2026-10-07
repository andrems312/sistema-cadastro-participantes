"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/constants";
import { mensagemErroBanco } from "@/lib/utils/errors";
import { errosPorCampo } from "@/lib/validations/auth";
import type { ActionResult, FormState } from "@/types/database";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("usuarios").select("tipo_acesso").eq("id", user.id).single();
  return perfil?.tipo_acesso === "admin" ? supabase : null;
}

const SEM_PERMISSAO = "Somente administradores podem alterar as configurações.";

async function caminhoLogoAtual(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("configuracoes").select("logo_path").eq("id", 1).single();
  return data?.logo_path ?? null;
}

/** Vincula a logo recém-enviada (via /api/upload) e remove a anterior do Storage. */
export async function definirLogo(path: string): Promise<ActionResult> {
  const supabase = await exigirAdmin();
  if (!supabase) return { ok: false, message: SEM_PERMISSAO };
  if (!/^logo-\d+\.(jpg|png|webp)$/.test(path)) return { ok: false, message: "Arquivo de logo inválido." };

  const anterior = await caminhoLogoAtual(supabase);
  const url = supabase.storage.from(BUCKETS.branding).getPublicUrl(path).data.publicUrl;

  const { error } = await supabase.from("configuracoes").update({ logo_url: url, logo_path: path }).eq("id", 1);
  if (error) {
    await supabase.storage.from(BUCKETS.branding).remove([path]);
    return { ok: false, message: mensagemErroBanco(error) };
  }
  if (anterior && anterior !== path) await supabase.storage.from(BUCKETS.branding).remove([anterior]);

  revalidatePath("/", "layout");
  return { ok: true, message: "Logo atualizada com sucesso." };
}

export async function removerLogo(): Promise<ActionResult> {
  const supabase = await exigirAdmin();
  if (!supabase) return { ok: false, message: SEM_PERMISSAO };

  const anterior = await caminhoLogoAtual(supabase);
  const { error } = await supabase.from("configuracoes").update({ logo_url: null, logo_path: null }).eq("id", 1);
  if (error) return { ok: false, message: mensagemErroBanco(error) };
  if (anterior) await supabase.storage.from(BUCKETS.branding).remove([anterior]);

  revalidatePath("/", "layout");
  return { ok: true, message: "Logo removida." };
}

const organizacaoSchema = z.object({
  nome_organizacao: z.string().trim().min(2, "Informe o nome da organização.").max(80, "Máximo de 80 caracteres."),
});

export async function salvarOrganizacao(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await exigirAdmin();
  const valores = { nome_organizacao: String(formData.get("nome_organizacao") ?? "") };
  if (!supabase) return { ok: false, message: SEM_PERMISSAO, valores };

  const parsed = organizacaoSchema.safeParse(valores);
  if (!parsed.success) return { ok: false, fieldErrors: errosPorCampo(parsed.error), valores };

  const { error } = await supabase.from("configuracoes").update(parsed.data).eq("id", 1);
  if (error) return { ok: false, message: mensagemErroBanco(error), valores };

  revalidatePath("/", "layout");
  return { ok: true, message: "Configurações salvas com sucesso.", valores: parsed.data };
}
