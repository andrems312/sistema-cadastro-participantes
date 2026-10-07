import type { Metadata } from "next";
import { RecoverForm } from "@/components/auth/recover-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recuperar senha</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">
        Informe o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
      </p>
      <RecoverForm />
    </div>
  );
}
