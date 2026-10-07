"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/constants";
import { geocodificacaoConfigurada, geocodificarEndereco } from "@/lib/services/geocoding";
import { mensagemErroBanco } from "@/lib/utils/errors";
import { errosPorCampo } from "@/lib/validations/auth";
import { participanteSchema } from "@/lib/validations/participante";
import type { ActionResult } from "@/types/database";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function contexto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("usuarios").select("tipo_acesso").eq("id", user.id).single();
  return { supabase, user, admin: perfil?.tipo_acesso === "admin" };
}

/**
 * Cria (id = null) ou atualiza um participante.
 * Valida no servidor, geocodifica o endereço quando necessário e cuida da troca/remoção de imagem.
 */
export async function salvarParticipante(id: string | null, entrada: unknown): Promise<ActionResult<{ id: string; geocodificado: boolean }>> {
  const ctx = await contexto();
  if (!ctx) return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  if (id !== null && !UUID.test(id)) return { ok: false, message: "Participante inválido." };

  const parsed = participanteSchema.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, message: "Revise os campos destacados.", fieldErrors: errosPorCampo(parsed.error) };
  }
  const dados = parsed.data;
  const { supabase, user } = ctx;

  // Situação atual (para edição): imagem anterior
  let imagemAnterior: string | null = null;
  if (id) {
    const { data: atual, error } = await supabase.from("participantes").select("imagem_path").eq("id", id).single();
    if (error || !atual) return { ok: false, message: "Participante não encontrado." };
    imagemAnterior = atual.imagem_path;
  }

  // Segurança: uma imagem NOVA só pode vir da pasta do próprio usuário no Storage.
  if (dados.imagem_path && dados.imagem_path !== imagemAnterior) {
    if (!dados.imagem_path.startsWith(`${user.id}/`) || dados.imagem_path.includes("..")) {
      return { ok: false, message: "Imagem inválida." };
    }
  }
  const imagem_url = dados.imagem_path
    ? supabase.storage.from(BUCKETS.participantes).getPublicUrl(dados.imagem_path).data.publicUrl
    : null;

  // Geocodificação automática quando não há coordenadas
  let latitude = dados.latitude;
  let longitude = dados.longitude;
  let geocodificado = false;
  if ((latitude === null || longitude === null) && geocodificacaoConfigurada()) {
    try {
      const resultado = await geocodificarEndereco(dados);
      if (resultado) {
        latitude = resultado.latitude;
        longitude = resultado.longitude;
        geocodificado = true;
      }
    } catch (e) {
      // O cadastro não deve falhar só porque o serviço de mapas está indisponível.
      console.warn("[salvarParticipante] geocodificação falhou:", e);
    }
  }

  const registro = {
    cpf_cnpj: dados.cpf_cnpj,
    nome: dados.nome,
    razao_social: dados.cpf_cnpj.length === 14 ? dados.nome : null,
    nome_fantasia: dados.nome_fantasia,
    email: dados.email,
    telefone: dados.telefone,
    cep: dados.cep,
    endereco: dados.endereco,
    numero: dados.numero,
    complemento: dados.complemento,
    bairro: dados.bairro,
    cidade: dados.cidade,
    estado: dados.estado,
    categoria: dados.categoria,
    latitude,
    longitude,
    imagem_path: dados.imagem_path,
    imagem_url,
    observacoes: dados.observacoes,
  };

  let idSalvo = id;
  if (id) {
    const { error } = await supabase.from("participantes").update(registro).eq("id", id);
    if (error) return { ok: false, message: mensagemErroBanco(error), fieldErrors: camposDoErro(error) };
  } else {
    const { data, error } = await supabase.from("participantes").insert(registro).select("id").single();
    if (error || !data) return { ok: false, message: mensagemErroBanco(error), fieldErrors: camposDoErro(error) };
    idSalvo = data.id;
  }

  // Imagem substituída ou removida: apaga o arquivo antigo do Storage
  if (imagemAnterior && imagemAnterior !== dados.imagem_path) {
    const { error } = await supabase.storage.from(BUCKETS.participantes).remove([imagemAnterior]);
    if (error) console.warn("[salvarParticipante] não foi possível remover a imagem antiga:", error.message);
  }

  revalidatePath("/participantes");
  revalidatePath("/dashboard");
  if (idSalvo) revalidatePath(`/participantes/${idSalvo}`);

  return {
    ok: true,
    message: id ? "Participante atualizado com sucesso!" : "Participante cadastrado com sucesso!",
    data: { id: idSalvo!, geocodificado },
  };
}

function camposDoErro(erro: { code?: string; message?: string } | null): Record<string, string> | undefined {
  if (erro?.code === "23505" && erro.message?.includes("cpf_cnpj")) {
    return { cpf_cnpj: "Já existe um participante cadastrado com este CPF/CNPJ." };
  }
  return undefined;
}

/** Exclui um participante (somente administradores — reforçado também pelo RLS). */
export async function excluirParticipante(id: string): Promise<ActionResult> {
  const ctx = await contexto();
  if (!ctx) return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  if (!ctx.admin) return { ok: false, message: "Somente administradores podem excluir participantes." };
  if (!UUID.test(id)) return { ok: false, message: "Participante inválido." };

  const { supabase } = ctx;
  const { data: atual } = await supabase.from("participantes").select("imagem_path").eq("id", id).single();

  const { error, count } = await supabase.from("participantes").delete({ count: "exact" }).eq("id", id);
  if (error) return { ok: false, message: mensagemErroBanco(error) };
  if (!count) return { ok: false, message: "Participante não encontrado ou sem permissão para excluir." };

  if (atual?.imagem_path) {
    await supabase.storage.from(BUCKETS.participantes).remove([atual.imagem_path]);
  }

  revalidatePath("/participantes");
  revalidatePath("/dashboard");
  return { ok: true, message: "Participante excluído com sucesso." };
}
