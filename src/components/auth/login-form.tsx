"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { entrar } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import { PasswordInput } from "@/components/auth/password-input";
import type { FormState } from "@/types/database";

const inicial: FormState = { ok: false };

export function LoginForm({ redirectTo, erroInicial }: { redirectTo?: string; erroInicial?: string }) {
  const [estado, acao, pendente] = useActionState(entrar, inicial);
  const erros = estado.fieldErrors ?? {};
  const mensagem = estado.message ?? (estado === inicial ? erroInicial : undefined);

  return (
    <form action={acao} className="space-y-5" noValidate>
      {mensagem && <Alert tom="perigo">{mensagem}</Alert>}
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />

      <Field id="email" label="E-mail" erro={erros.email} obrigatorio>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@empresa.com"
          defaultValue={estado.valores?.email}
          erro={erros.email}
          required
        />
      </Field>

      <Field id="senha" label="Senha" erro={erros.senha} obrigatorio>
        <PasswordInput id="senha" name="senha" autoComplete="current-password" erro={erros.senha} required />
      </Field>

      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-medium text-brand-700 hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      <Button type="submit" tamanho="lg" className="w-full" carregando={pendente} icone={<LogIn className="size-4" aria-hidden />}>
        {pendente ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Ainda não tem acesso?{" "}
        <Link href="/criar-acesso" className="font-medium text-brand-700 hover:underline">
          Criar acesso
        </Link>
      </p>
    </form>
  );
}
