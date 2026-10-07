import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  "link-invalido": "O link é inválido ou expirou. Solicite um novo.",
  sessao: "Sua sessão expirou. Entre novamente.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; erro?: string }>;
}) {
  const { redirectTo, erro } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h1>
      <p className="mt-1 mb-8 text-sm text-slate-500">Entre com seu e-mail e senha para acessar o sistema.</p>
      <LoginForm redirectTo={redirectTo} erroInicial={erro ? ERROS[erro] : undefined} />
    </div>
  );
}
