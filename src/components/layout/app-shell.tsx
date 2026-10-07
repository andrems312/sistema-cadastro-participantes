"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { sair } from "@/actions/auth";
import { Logo } from "@/components/layout/logo";
import { Avatar, Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils/cn";
import type { TipoAcesso } from "@/types/database";

interface ItemMenu {
  href: string;
  label: string;
  icone: LucideIcon;
  somenteAdmin?: boolean;
  exato?: boolean;
}

const MENU: ItemMenu[] = [
  { href: "/dashboard", label: "Dashboard", icone: LayoutDashboard },
  { href: "/participantes", label: "Participantes", icone: UsersRound, exato: true },
  { href: "/participantes/novo", label: "Cadastrar participante", icone: UserPlus },
  { href: "/usuarios", label: "Usuários", icone: Users, somenteAdmin: true },
  { href: "/configuracoes", label: "Configurações", icone: Settings, somenteAdmin: true },
];

interface AppShellProps {
  usuario: { nome: string; email: string; tipo_acesso: TipoAcesso };
  config: { nome_organizacao: string; logo_url: string | null };
  children: React.ReactNode;
}

export function AppShell({ usuario, config, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const admin = usuario.tipo_acesso === "admin";
  const itens = MENU.filter((i) => !i.somenteAdmin || admin);

  // Fecha o menu móvel ao navegar
  useEffect(() => setMenuAberto(false), [pathname]);

  // Trava a rolagem do fundo e permite fechar com ESC
  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuAberto]);

  const ativo = (item: ItemMenu) => {
    if (item.exato) {
      // "Participantes" fica ativo na lista, visualização e edição, mas não em "novo"
      return pathname === item.href || (pathname.startsWith(`${item.href}/`) && !pathname.startsWith("/participantes/novo"));
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const navegacao = (
    <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-1 px-3">
      {itens.map((item) => {
        const Icone = item.icone;
        const atual = ativo(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={atual ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              atual ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icone className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const rodapeUsuario = (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar nome={usuario.nome} tamanho="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{usuario.nome}</p>
          <p className="truncate text-xs text-slate-500">{usuario.email}</p>
        </div>
      </div>
      <form action={sair}>
        <button
          type="submit"
          className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="size-5" aria-hidden /> Sair
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* Menu lateral fixo (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link href="/dashboard" aria-label="Ir para o dashboard">
            <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="sm" />
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">{navegacao}</div>
        {rodapeUsuario}
      </aside>

      {/* Menu lateral (gaveta) no celular/tablet */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="sm" />
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto py-4">{navegacao}</div>
            {rodapeUsuario}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Cabeçalho */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="-ml-2 flex size-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
          >
            <Menu className="size-6" aria-hidden />
          </button>

          <Link href="/dashboard" className="min-w-0 lg:hidden" aria-label="Ir para o dashboard">
            <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="sm" />
          </Link>
          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <Logo logoUrl={config.logo_url} nome={config.nome_organizacao} tamanho="sm" mostrarNome={false} />
            <span className="truncate text-sm text-slate-500">
              Olá, <span className="font-medium text-slate-900">{usuario.nome.split(" ")[0]}</span>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge tom={admin ? "marca" : "neutro"} className="hidden sm:inline-flex">
              {admin && <ShieldCheck className="size-3.5" aria-hidden />}
              {admin ? "Administrador" : "Usuário"}
            </Badge>
            <form action={sair} className="hidden sm:block lg:hidden">
              <button
                type="submit"
                className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Sair"
              >
                <LogOut className="size-5" aria-hidden />
              </button>
            </form>
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
