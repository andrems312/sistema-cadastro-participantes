"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-red-50 p-3 text-red-600">
        <AlertOctagon className="size-7" aria-hidden />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Algo deu errado</h1>
      <p className="mt-2 text-sm text-slate-600">
        {process.env.NODE_ENV === "development" ? error.message : "Não foi possível carregar esta página. Tente novamente em instantes."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset} icone={<RotateCcw className="size-4" aria-hidden />}>
          Tentar novamente
        </Button>
        <ButtonLink href="/dashboard" variante="outline">
          Ir para o dashboard
        </ButtonLink>
      </div>
    </main>
  );
}
