import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { getConfiguracoes } from "@/lib/services/configuracoes";

export const dynamic = "force-dynamic";

const destaques = [
  "Cadastro de pessoas e empresas com validação de CPF/CNPJ",
  "Preenchimento automático pelo CNPJ e pelo CEP",
  "Localização no mapa com OpenStreetMap",
  "Controle de acesso por perfil",
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfiguracoes();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="rounded-xl bg-white/95 px-4 py-3 self-start shadow-sm">
          <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} />
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Gestão de participantes simples, segura e organizada.</h2>
          <ul className="mt-8 space-y-3">
            {destaques.map((d) => (
              <li key={d} className="flex items-start gap-3 text-brand-100">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-300" aria-hidden />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-brand-200">© {new Date().getFullYear()} {config.nome_organizacao}</p>
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="lg" />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
