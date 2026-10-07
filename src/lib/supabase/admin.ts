import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Cliente com a chave service_role — ignora RLS.
 * Usado SOMENTE no servidor e SOMENTE depois de confirmar que quem chama é administrador
 * (criar/excluir contas no Supabase Auth).
 */
export function createAdminClient() {
  const key = serverEnv.supabaseServiceRoleKey;
  if (!publicEnv.supabaseUrl || !key) return null;
  return createClient(publicEnv.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
