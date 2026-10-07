import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FieldProps {
  id: string;
  label: string;
  erro?: string;
  dica?: ReactNode;
  obrigatorio?: boolean;
  className?: string;
  children: ReactNode;
}

/** Rótulo + campo + mensagem de erro/dica, com associação ARIA correta. */
export function Field({ id, label, erro, dica, obrigatorio, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {obrigatorio && (
          <span className="ml-0.5 text-red-600" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="text-xs text-slate-500">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

type ComErro = { erro?: string };

function ariaProps(id: string | undefined, erro?: string) {
  return {
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": erro && id ? `${id}-erro` : undefined,
  } as const;
}

export function Input({ className, erro, id, ...props }: ComponentProps<"input"> & ComErro) {
  return <input id={id} className={cn("input-base", className)} {...ariaProps(id, erro)} {...props} />;
}

export function Select({ className, erro, id, children, ...props }: ComponentProps<"select"> & ComErro) {
  return (
    <select id={id} className={cn("input-base pr-8", className)} {...ariaProps(id, erro)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, erro, id, ...props }: ComponentProps<"textarea"> & ComErro) {
  return <textarea id={id} className={cn("input-base min-h-24", className)} {...ariaProps(id, erro)} {...props} />;
}
