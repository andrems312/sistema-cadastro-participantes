import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Cliente Supabase para componentes "use client" (usa a chave pública + RLS). */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
