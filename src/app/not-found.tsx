import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-brand-50 p-3 text-brand-600">
        <FileQuestion className="size-7" aria-hidden />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        O endereço acessado não existe ou o registro foi removido.
      </p>
      <ButtonLink href="/dashboard" className="mt-6">
        Voltar ao início
      </ButtonLink>
    </main>
  );
}
