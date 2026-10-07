import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({
  titulo,
  descricao,
  acoes,
  icone,
  className,
}: {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  icone?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4", className)}>
      <div className="flex items-start gap-3">
        {icone && <div className="mt-0.5 text-brand-600">{icone}</div>}
        <div>
          <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-sm text-slate-500">{descricao}</p>}
        </div>
      </div>
      {acoes}
    </div>
  );
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}
