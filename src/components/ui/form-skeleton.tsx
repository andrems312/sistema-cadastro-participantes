import { Skeleton } from "@/components/ui/misc";

/** Skeleton genérico para páginas de formulário/detalhes. */
export function FormSkeleton({ blocos = 3 }: { blocos?: number }) {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 mb-6 h-4 w-96 max-w-full" />
      <div className="space-y-6">
        {Array.from({ length: blocos }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="mb-5 h-5 w-48" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
