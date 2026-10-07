import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Configuracoes } from "@/types/database";

const PADRAO: Pick<Configuracoes, "nome_organizacao" | "logo_url"> = {
  nome_organizacao: "Cadastro de Participantes",
  logo_url: null,
};

/** Configurações da organização (nome e logo). Leitura pública, com fallback seguro. */
export const getConfiguracoes = cache(async (): Promise<Pick<Configuracoes, "nome_organizacao" | "logo_url">> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("configuracoes")
      .select("nome_organizacao, logo_url")
      .eq("id", 1)
      .maybeSingle();
    return data ?? PADRAO;
  } catch {
    return PADRAO;
  }
});
