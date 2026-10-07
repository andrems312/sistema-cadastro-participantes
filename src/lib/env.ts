/**
 * Leitura centralizada das variáveis de ambiente.
 * Variáveis NEXT_PUBLIC_* precisam ser referenciadas literalmente para o Next.js
 * conseguir embuti-las no bundle do navegador.
 */

export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export function assertSupabaseEnv() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja o README).",
    );
  }
}

/** Variáveis exclusivas do servidor. Nunca importe este objeto em componentes "use client". */
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  },
  get geocodingApiUrl() {
    return (process.env.GEOCODING_API_URL || "https://nominatim.openstreetmap.org").replace(/\/$/, "");
  },
  /** E-mail de contato enviado ao Nominatim (recomendado pela política de uso do OpenStreetMap). */
  get geocodingEmail() {
    return process.env.GEOCODING_EMAIL ?? "";
  },
  get cnpjApiUrl() {
    return (process.env.CNPJ_API_URL || "https://brasilapi.com.br/api/cnpj/v1").replace(/\/$/, "");
  },
  get cepApiUrl() {
    return (process.env.CEP_API_URL || "https://brasilapi.com.br/api/cep/v2").replace(/\/$/, "");
  },
  get cnpjRateLimitPerMinute() {
    const n = Number(process.env.CNPJ_RATE_LIMIT_PER_MINUTE);
    return Number.isFinite(n) && n > 0 ? n : 10;
  },
};
