import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar acesso" };

export default function CriarAcessoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Criar acesso</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">Preencha seus dados para solicitar acesso ao sistema.</p>
      <SignupForm />
    </div>
  );
}
