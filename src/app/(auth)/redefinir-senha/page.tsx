import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Redefinir senha" };

// Página acessada pelo link do e-mail de recuperação: o /auth/callback cria uma
// sessão temporária e o middleware garante que só usuários com sessão cheguem aqui.
export default function RedefinirSenhaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Criar nova senha</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">Defina uma nova senha para o seu acesso.</p>
      <ResetForm />
    </div>
  );
}
