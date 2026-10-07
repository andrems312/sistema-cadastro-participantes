import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  /** Parâmetros atuais da URL (filtros), preservados ao trocar de página. */
  params: Record<string, string | undefined>;
  caminho: string;
}

export function Paginacao({ pagina, totalPaginas, total, params, caminho }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "pagina") qs.set(k, v);
    if (p > 1) qs.set("pagina", String(p));
    const s = qs.toString();
    return s ? `${caminho}?${s}` : caminho;
  };

  const desabilitado = "pointer-events-none opacity-50";

  return (
    <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Página <span className="font-medium text-slate-700">{pagina}</span> de {totalPaginas} · {total} registros
      </p>
      <div className="flex gap-2">
        <Link
          href={href(pagina - 1)}
          className={cn(buttonClasses("outline", "md"), pagina <= 1 && desabilitado)}
          aria-disabled={pagina <= 1}
          tabIndex={pagina <= 1 ? -1 : undefined}
        >
          <ChevronLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">Anterior</span>
        </Link>
        <Link
          href={href(pagina + 1)}
          className={cn(buttonClasses("outline", "md"), pagina >= totalPaginas && desabilitado)}
          aria-disabled={pagina >= totalPaginas}
          tabIndex={pagina >= totalPaginas ? -1 : undefined}
        >
          <span className="hidden sm:inline">Próxima</span> <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
