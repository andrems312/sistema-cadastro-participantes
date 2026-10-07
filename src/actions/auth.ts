"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { mensagemErroAuth } from "@/lib/utils/errors";
import {
  criarAcessoSchema,
  errosPorCampo,
  loginSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
} from "@/lib/validations/auth";
import type { FormState } from "@/types/database";

/** Aceita apenas caminhos internos (evita open redirect). */
function destinoSeguro(valor: FormDataEntryValue | null, padrao = "/dashboard"): string {
  const v = typeof valor === "string" ? valor : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : padrao;
}

function texto(formData: FormData, campo: string): string {
  const v = formData.get(campo);
  return typeof v === "string" ? v : "";
}

export async function entrar(_prev: FormState, formData: FormData): Promise<FormState> {
  const valores = { email: texto(formData, "email") };
  const parsed = loginSchema.safeParse({ email: texto(formData, "email"), senha: texto(formData, "senha") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: errosPorCampo(parsed.error), valores };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error) return { ok: false, message: mensagemErroAuth(error), valores };

  redirect(destinoSeguro(formData.get("redirectTo")));
}

export async function criarAcesso(_prev: FormState, formData: FormData): Promise<FormState> {
  const bruto = {
    nome: texto(formData, "nome"),
    email: texto(formData, "email"),
    senha: texto(formData, "senha"),
    confirmacao: texto(formData, "confirmacao"),
    tipo_acesso: texto(formData, "tipo_acesso"),
  };
  const valores = { nome: bruto.nome, email: bruto.email, tipo_acesso: bruto.tipo_acesso };

  const parsed = criarAcessoSchema.safeParse(bruto);
  if (!parsed.success) return { ok: false, fieldErrors: errosPorCampo(parsed.error), valores };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.senha,
    options: {
      // user_metadata é controlado pelo cliente: o banco NÃO concede admin com base nele,
      // apenas registra a solicitação (tipo_solicitado) para aprovação de um administrador.
      data: { nome: parsed.data.nome, tipo_solicitado: parsed.data.tipo_acesso },
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { ok: false, message: mensagemErroAuth(error), valores };

  // Com confirmação de e-mail ativa, o Supabase não revela se o e-mail já existe:
  // devolve um usuário sem identidades.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, message: "Já existe um acesso cadastrado com este e-mail.", valores };
  }

  if (data.session) {
    redirect("/dashboard?aviso=bem-vindo");
  }

  const avisoAdmin =
    parsed.data.tipo_acesso === "admin"
      ? " O acesso de Administrador será liberado após aprovação de um administrador do sistema."
      : "";
  return {
    ok: true,
    message: `Cadastro realizado! Enviamos um link de confirmação para ${parsed.data.email}.${avisoAdmin}`,
  };
}

export async function recuperarSenha(_prev: FormState, formData: FormData): Promise<FormState> {
  const valores = { email: texto(formData, "email") };
  const parsed = recuperarSenhaSchema.safeParse(valores);
  if (!parsed.success) return { ok: false, fieldErrors: errosPorCampo(parsed.error), valores };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  // Limite de envio é o único erro exibido: não revelamos se o e-mail existe.
  if (error && (error.status === 429 || error.code?.includes("rate_limit"))) {
    return { ok: false, message: mensagemErroAuth(error), valores };
  }

  return {
    ok: true,
    message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes.",
  };
}

export async function redefinirSenha(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = redefinirSenhaSchema.safeParse({
    senha: texto(formData, "senha"),
    confirmacao: texto(formData, "confirmacao"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: errosPorCampo(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "O link de recuperação expirou. Solicite um novo." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return { ok: false, message: mensagemErroAuth(error) };

  redirect("/dashboard?aviso=senha-alterada");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
