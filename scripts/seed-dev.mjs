/**
 * Popula um projeto Supabase de DESENVOLVIMENTO com usuários e participantes de exemplo.
 *
 *   npm run seed:dev
 *
 * Proteções para não misturar dados de exemplo com produção:
 *   - exige SEED_ALLOW=true no .env.local;
 *   - recusa rodar se NODE_ENV ou VERCEL_ENV for "production";
 *   - todos os registros têm "(Exemplo)" no nome e documentos com prefixo 9000000…
 *
 * Recomenda-se usar um projeto Supabase separado (ou o Supabase local) para desenvolvimento.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

function abortar(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  abortar("Seed bloqueado: ambiente de produção detectado.");
}
if (process.env.SEED_ALLOW !== "true") {
  abortar("Defina SEED_ALLOW=true no .env.local (somente em desenvolvimento) para rodar o seed.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const senha = process.env.SEED_ADMIN_PASSWORD;

if (!url || !serviceKey) abortar("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
if (!senha || senha.length < 8) abortar("Defina SEED_ADMIN_PASSWORD (mínimo 8 caracteres) para os usuários de teste.");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function garantirUsuario(email, nome, tipo) {
  const { data: lista, error: erroLista } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (erroLista) throw erroLista;
  const existente = lista.users.find((u) => u.email === email);
  if (existente) {
    console.log(`• Usuário já existe: ${email}`);
    return existente.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
    app_metadata: { tipo_acesso: tipo },
  });
  if (error) throw error;
  console.log(`✔ Usuário criado: ${email} (${tipo})`);
  return data.user.id;
}

async function main() {
  console.log(`Seed de desenvolvimento em ${url}\n`);

  const adminId = await garantirUsuario("admin.dev@exemplo.com", "Administrador (Exemplo)", "admin");
  await garantirUsuario("usuario.dev@exemplo.com", "Usuário Comum (Exemplo)", "usuario");

  const dados = JSON.parse(await readFile(new URL("../supabase/dados-exemplo.json", import.meta.url), "utf8"));
  const registros = dados.map((p) => ({ ...p, criado_por: adminId }));

  const { error, count } = await supabase
    .from("participantes")
    .upsert(registros, { onConflict: "cpf_cnpj", ignoreDuplicates: true, count: "exact" });
  if (error) throw error;

  console.log(`✔ Participantes de exemplo inseridos: ${count ?? registros.length}`);
  console.log("\nPronto! Entre com admin.dev@exemplo.com ou usuario.dev@exemplo.com e a senha definida em SEED_ADMIN_PASSWORD.");
}

main().catch((e) => abortar(e.message ?? String(e)));
