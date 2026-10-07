import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variante = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Tamanho = "sm" | "md" | "lg" | "icon";

const variantes: Record<Variante, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  outline: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
};

// Alturas mínimas de 44px no celular (área de toque confortável), menores no desktop.
const tamanhos: Record<Tamanho, string> = {
  sm: "min-h-9 px-3 text-sm gap-1.5",
  md: "min-h-11 px-4 text-sm gap-2 sm:min-h-10",
  lg: "min-h-12 px-5 text-base gap-2",
  icon: "size-11 sm:size-10",
};

export function buttonClasses(variante: Variante = "primary", tamanho: Tamanho = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-60",
    variantes[variante],
    tamanhos[tamanho],
    className,
  );
}

interface ButtonProps extends ComponentProps<"button"> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  icone?: ReactNode;
}

export function Button({
  variante = "primary",
  tamanho = "md",
  carregando = false,
  icone,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variante, tamanho, className)}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icone}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: ReactNode;
}

export function ButtonLink({ variante = "primary", tamanho = "md", icone, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variante, tamanho, className)} {...props}>
      {icone}
      {children}
    </Link>
  );
}
