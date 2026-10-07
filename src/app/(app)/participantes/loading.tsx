import { Skeleton } from "@/components/ui/misc";

export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando participantes">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 mb-6 h-4 w-80 max-w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-6 w-20 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
