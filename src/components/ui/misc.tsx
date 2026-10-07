import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { iniciais } from "@/lib/utils/format";

/* ---------------- Badge ---------------- */
type Tom = "neutro" | "marca" | "sucesso" | "alerta" | "perigo";
const tons: Record<Tom, string> = {
  neutro: "bg-slate-100 text-slate-700 ring-slate-200",
  marca: "bg-brand-50 text-brand-700 ring-brand-200",
  sucesso: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  alerta: "bg-amber-50 text-amber-800 ring-amber-200",
  perigo: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({ tom = "neutro", className, ...props }: ComponentProps<"span"> & { tom?: Tom }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tons[tom], className)}
      {...props}
    />
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} aria-hidden {...props} />;
}

/* ---------------- Estado vazio ---------------- */
export function EmptyState({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icone && <div className="rounded-full bg-brand-50 p-3 text-brand-600">{icone}</div>}
      <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
      {descricao && <p className="max-w-sm text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

/* ---------------- Cabeçalho de página ---------------- */
export function PageHeader({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({
  nome,
  src,
  tamanho = "md",
  className,
}: {
  nome: string;
  src?: string | null;
  tamanho?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const t = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-base", xl: "size-24 text-2xl" }[tamanho];
  if (src) {
    return <img src={src} alt={`Imagem de ${nome}`} loading="lazy" className={cn("shrink-0 rounded-full object-cover ring-1 ring-slate-200", t, className)} />;
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700", t, className)}
      aria-hidden
    >
      {iniciais(nome) || "?"}
    </span>
  );
}

/* ---------------- Alerta inline ---------------- */
export function Alert({
  tom = "alerta",
  titulo,
  children,
  className,
}: {
  tom?: "alerta" | "perigo" | "info" | "sucesso";
  titulo?: string;
  children?: ReactNode;
  className?: string;
}) {
  const estilos = {
    alerta: "border-amber-200 bg-amber-50 text-amber-900",
    perigo: "border-red-200 bg-red-50 text-red-800",
    info: "border-brand-200 bg-brand-50 text-brand-900",
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tom];
  return (
    <div role={tom === "perigo" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", estilos, className)}>
      {titulo && <p className="font-semibold">{titulo}</p>}
      {children && <div className={cn(titulo && "mt-1")}>{children}</div>}
    </div>
  );
}
