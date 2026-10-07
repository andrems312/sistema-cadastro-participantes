"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mensagemErroAuth, mensagemErroBanco } from "@/lib/utils/errors";
import { emailSchema, errosPorCampo, nomeSchema, senhaForteSchema, tipoAcessoSchema } from "@/lib/validations/auth";
import type { ActionResult, FormState, TipoAcesso } from "@/types/database";

const uuid = z.string().uuid();

/** Confirma no servidor que quem chama é administrador. */
async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("usuarios").select("tipo_acesso").eq("id", user.id).single();
  if (perfil?.tipo_acesso !== "admin") return null;
  return { supabase, user };
}

const SEM_PERMISSAO: ActionResult = { ok: false, message: "Somente administradores podem gerenciar acessos." };

export async function alterarTipoAcesso(id: string, tipo: TipoAcesso): Promise<ActionResult> {
  const ctx = await exigirAdmin();
  if (!ctx) return SEM_PERMISSAO;
  if (!uuid.safeParse(id).success || !tipoAcessoSchema.safeParse(tipo).success) {
    return { ok: false, message: "Dados inválidos." };
  }
  if (id === ctx.user.id) return { ok: false, message: "Você não pode alterar o seu próprio nível de acesso." };

  // Ao definir o tipo, a solicitação pendente (se houver) é considerada atendida.
  const { error } = await ctx.supabase.from("usuarios").update({ tipo_acesso: tipo, tipo_solicitado: tipo }).eq("id", id);
  if (error) return { ok: false, message: mensagemErroBanco(error) };

  revalidatePath("/usuarios");
  return { ok: true, message: tipo === "admin" ? "Acesso alterado para Administrador." : "Acesso alterado para Usuário." };
}

export async function recusarSolicitacao(id: string): Promise<ActionResult> {
  const ctx = await exigirAdmin();
  if (!ctx) return SEM_PERMISSAO;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Dados inválidos." };

  const { error } = await ctx.supabase.from("usuarios").update({ tipo_solicitado: "usuario" }).eq("id", id);
  if (error) return { ok: false, message: mensagemErroBanco(error) };
  revalidatePath("/usuarios");
  return { ok: true, message: "Solicitação de administrador recusada." };
}

const novoUsuarioSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  senha: senhaForteSchema,
  tipo_acesso: tipoAcessoSchema,
});

export async function criarUsuario(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await exigirAdmin();
  if (!ctx) return { ok: false, message: SEM_PERMISSAO.message };

  const bruto = {
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    tipo_acesso: String(formData.get("tipo_acesso") ?? ""),
  };
  const valores = { nome: bruto.nome, email: bruto.email, tipo_acesso: bruto.tipo_acesso };
  const parsed = novoUsuarioSchema.safeParse(bruto);
  if (!parsed.success) return { ok: false, fieldErrors: errosPorCampo(parsed.error), valores };

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Para criar usuários pelo painel, configure SUPABASE_SERVICE_ROLE_KEY no servidor (veja o README).",
      valores,
    };
  }

  // app_metadata só pode ser definido com a service_role — o trigger do banco usa esse valor.
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senha,
    email_confirm: true,
    user_metadata: { nome: parsed.data.nome },
    app_metadata: { tipo_acesso: parsed.data.tipo_acesso },
  });
  if (error) return { ok: false, message: mensagemErroAuth(error), valores };

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
  return { ok: true, message: `Acesso criado para ${parsed.data.email}.` };
}

export async function excluirUsuario(id: string): Promise<ActionResult> {
  const ctx = await exigirAdmin();
  if (!ctx) return SEM_PERMISSAO;
  if (!uuid.safeParse(id).success) return { ok: false, message: "Dados inválidos." };
  if (id === ctx.user.id) return { ok: false, message: "Você não pode excluir o seu próprio acesso." };

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Para excluir usuários, configure SUPABASE_SERVICE_ROLE_KEY no servidor (veja o README)." };
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    const ultimoAdmin = error.message?.includes("último administrador");
    return { ok: false, message: ultimoAdmin ? "Não é possível excluir o último administrador." : "Não foi possível excluir o usuário." };
  }

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
  return { ok: true, message: "Usuário excluído. Os participantes cadastrados por ele foram mantidos." };
}
