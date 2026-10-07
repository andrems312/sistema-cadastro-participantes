import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatarNumero } from "@/lib/utils/format";

interface StatCardProps {
  titulo: string;
  valor: number;
  icone: LucideIcon;
  descricao?: string;
  href?: string;
  cor?: "brand" | "emerald" | "amber" | "violet";
}

const cores = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({ titulo, valor, icone: Icone, descricao, href, cor = "brand" }: StatCardProps) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <span className={cn("hidden rounded-lg p-2 sm:inline-flex", cores[cor])}>
          <Icone className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-3xl">{formatarNumero(valor)}</p>
      {descricao && <p className="mt-1 text-xs text-slate-500">{descricao}</p>}
    </>
  );

  const classes = "block min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";
  return href ? (
    <Link href={href} className={cn(classes, "transition hover:border-brand-200 hover:shadow-md")}>
      {conteudo}
    </Link>
  ) : (
    <div className={classes}>{conteudo}</div>
  );
}
