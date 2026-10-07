/**
 * Diagnóstico da integração com o Supabase.
 *
 *   npm run check:supabase
 *
 * Verifica, em ordem: variáveis do .env.local, conexão com o projeto, validade das chaves,
 * se a migração (tabelas, funções e buckets) foi aplicada. Não altera nenhum dado.
 */
import { createClient } from "@supabase/supabase-js";

const ok = (m) => console.log(`  ✔ ${m}`);
const aviso = (m) => console.log(`  ⚠ ${m}`);
let falhas = 0;
const erro = (m, dica) => {
  falhas++;
  console.log(`  ✖ ${m}`);
  if (dica) console.log(`      → ${dica}`);
};

async function main() {
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

console.log("\n1) Variáveis de ambiente (.env.local)");
if (!url || url.includes("SEU-PROJETO")) {
  erro("NEXT_PUBLIC_SUPABASE_URL não preenchida", "Supabase → Project Settings → API (ou Data API) → Project URL");
} else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) && !url.startsWith("http://127.0.0.1") && !url.startsWith("http://localhost")) {
  erro(`URL com formato inesperado: ${url}`, "Deve ser algo como https://abcdefghijkl.supabase.co (sem /rest/v1 no final)");
} else ok(`URL: ${url}`);

if (!anon) erro("NEXT_PUBLIC_SUPABASE_ANON_KEY vazia", "Project Settings → API Keys → chave 'anon' (eyJ...) ou 'publishable' (sb_publishable_...)");
else if (anon.startsWith("sb_secret_") || anon === service) erro("A chave pública parece ser a chave SECRETA", "Use a chave anon/publishable em NEXT_PUBLIC_SUPABASE_ANON_KEY");
else ok("Chave pública preenchida");

if (!service) aviso("SUPABASE_SERVICE_ROLE_KEY vazia (opcional, mas necessária para o admin criar/excluir usuários)");
else ok("Chave service_role preenchida");

if (falhas) {
  console.log("\nCorrija o .env.local, salve e rode de novo: npm run check:supabase\n");
  return 1;
}

console.log("\n2) Conexão e chaves");
const sb = createClient(url, anon, { auth: { persistSession: false } });
try {
  const { error } = await sb.auth.getSession();
  if (error) throw error;
  const r = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: anon } });
  if (r.status === 401 || r.status === 403) erro("Chave pública recusada pelo Supabase", "Copie novamente a chave anon/publishable do MESMO projeto da URL");
  else if (!r.ok) erro(`Supabase respondeu HTTP ${r.status}`, "Confira se o projeto não está pausado no painel do Supabase");
  else ok("Projeto acessível e chave pública aceita");
} catch (e) {
  erro(`Não foi possível conectar: ${e.message}`, "Confira a URL, sua internet e se o projeto não está pausado");
}

if (falhas) return 1;

console.log("\n3) Banco de dados (migração)");
const admin = service ? createClient(url, service, { auth: { persistSession: false } }) : null;
const cliente = admin ?? sb;
let migracaoFaltando = false;
for (const tabela of ["usuarios", "participantes", "configuracoes"]) {
  const { error } = await cliente.from(tabela).select("*").limit(1);
  if (error && (error.code === "PGRST205" || /does not exist|schema cache|Could not find/i.test(error.message))) {
    migracaoFaltando = true;
    erro(`Tabela "${tabela}" não existe`);
  } else if (error) {
    erro(`Tabela "${tabela}": ${error.message}`);
  } else ok(`Tabela "${tabela}" encontrada`);
}

if (admin) {
  const { error } = await admin.rpc("resumo_dashboard");
  if (error && /Could not find|does not exist/i.test(error.message)) {
    migracaoFaltando = true;
    erro('Função "resumo_dashboard" não existe');
  } else ok("Funções do banco encontradas");

  const { data: buckets, error: bErr } = await admin.storage.listBuckets();
  if (bErr) erro(`Storage: ${bErr.message}`);
  else {
    for (const b of ["participantes", "branding"]) {
      if (buckets.some((x) => x.id === b)) ok(`Bucket "${b}" encontrado`);
      else {
        migracaoFaltando = true;
        erro(`Bucket "${b}" não existe`);
      }
    }
  }

  const { data: users, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1 });
  if (uErr && /invalid|jwt|unauthorized/i.test(uErr.message)) {
    erro("Chave service_role recusada", "Copie a chave service_role/secret do MESMO projeto");
  } else if (!uErr) ok(`Chave service_role aceita (${users.users.length ? "já há usuários" : "nenhum usuário ainda"})`);
} else {
  aviso("Sem service_role: não foi possível verificar funções, buckets e usuários");
}

if (migracaoFaltando) {
  console.log(
    "\n  → A migração não foi aplicada. No painel do Supabase abra SQL Editor → New query,\n" +
      "    cole TODO o conteúdo de supabase/migrations/20261006000000_schema_inicial.sql e clique em Run.",
  );
}

console.log(falhas ? `\n✖ ${falhas} problema(s) encontrado(s).\n` : "\n✔ Supabase integrado corretamente. Reinicie o npm run dev e crie seu acesso.\n");
return falhas ? 1 : 0;
}

// exitCode em vez de process.exit(): evita travamento do Node no Windows com conexões ainda abertas
process.exitCode = await main();
