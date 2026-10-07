import { AppShell } from "@/components/layout/app-shell";
import { requireUsuario } from "@/lib/auth/session";
import { getConfiguracoes } from "@/lib/services/configuracoes";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const [{ perfil }, config] = await Promise.all([requireUsuario(), getConfiguracoes()]);

  return (
    <AppShell
      usuario={{ nome: perfil.nome, email: perfil.email, tipo_acesso: perfil.tipo_acesso }}
      config={{ nome_organizacao: config.nome_organizacao, logo_url: config.logo_url }}
    >
      {children}
    </AppShell>
  );
}
