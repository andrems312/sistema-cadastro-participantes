import { UsersRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  logoUrl?: string | null;
  nome: string;
  /** "claro" para fundos escuros (painel do login). */
  tema?: "escuro" | "claro";
  tamanho?: "sm" | "md" | "lg";
  mostrarNome?: boolean;
  className?: string;
}

/** Logo da organização (enviada pelo administrador) com fallback para o ícone padrão. */
export function Logo({ logoUrl, nome, tema = "escuro", tamanho = "md", mostrarNome = true, className }: LogoProps) {
  const altura = { sm: "h-8", md: "h-10", lg: "h-14" }[tamanho];
  const icone = { sm: "size-8", md: "size-10", lg: "size-14" }[tamanho];

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {logoUrl ? (
        <img src={logoUrl} alt={`Logo ${nome}`} className={cn("w-auto max-w-40 object-contain", altura)} />
      ) : (
        <span className={cn("inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white", icone)}>
          <UsersRound className="size-1/2" aria-hidden />
        </span>
      )}
      {mostrarNome && (
        <span
          className={cn(
            "truncate font-semibold leading-tight",
            tamanho === "lg" ? "text-xl" : "text-base",
            tema === "claro" ? "text-white" : "text-slate-900",
          )}
        >
          {nome}
        </span>
      )}
    </div>
  );
}
