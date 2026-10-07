"use client";

import Link from "next/link";
import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { criarAcesso } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import { PasswordInput } from "@/components/auth/password-input";
import type { FormState } from "@/types/database";

const inicial: FormState = { ok: false };

export function SignupForm() {
  const [estado, acao, pendente] = useActionState(criarAcesso, inicial);
  const erros = estado.fieldErrors ?? {};
  const v = estado.valores ?? {};

  if (estado.ok) {
    return (
      <div className="space-y-6">
        <Alert tom="sucesso" titulo="Verifique seu e-mail">
          {estado.message}
        </Alert>
        <Link href="/login" className="block text-center text-sm font-medium text-brand-700 hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-5" noValidate>
      {estado.message && <Alert tom="perigo">{estado.message}</Alert>}

      <Field id="nome" label="Nome completo" erro={erros.nome} obrigatorio>
        <Input id="nome" name="nome" autoComplete="name" defaultValue={v.nome} erro={erros.nome} required />
      </Field>

      <Field id="email" label="E-mail" erro={erros.email} obrigatorio>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={v.email}
          erro={erros.email}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="senha" label="Senha" erro={erros.senha} dica="Mínimo 8 caracteres, com letras e números." obrigatorio>
          <PasswordInput id="senha" name="senha" autoComplete="new-password" erro={erros.senha} required />
        </Field>
        <Field id="confirmacao" label="Confirmação de senha" erro={erros.confirmacao} obrigatorio>
          <PasswordInput id="confirmacao" name="confirmacao" autoComplete="new-password" erro={erros.confirmacao} required />
        </Field>
      </div>

      <Field
        id="tipo_acesso"
        label="Tipo de acesso"
        erro={erros.tipo_acesso}
        dica="Acessos de Administrador precisam ser aprovados por um administrador (o primeiro cadastro do sistema já é administrador)."
        obrigatorio
      >
        <Select id="tipo_acesso" name="tipo_acesso" defaultValue={v.tipo_acesso || "usuario"} erro={erros.tipo_acesso}>
          <option value="usuario">Usuário</option>
          <option value="admin">Administrador</option>
        </Select>
      </Field>

      <Button type="submit" tamanho="lg" className="w-full" carregando={pendente} icone={<UserPlus className="size-4" aria-hidden />}>
        {pendente ? "Criando acesso..." : "Criar acesso"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Já possui acesso?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
