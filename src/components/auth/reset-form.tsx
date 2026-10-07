"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { redefinirSenha } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import { PasswordInput } from "@/components/auth/password-input";
import type { FormState } from "@/types/database";

const inicial: FormState = { ok: false };

export function ResetForm() {
  const [estado, acao, pendente] = useActionState(redefinirSenha, inicial);
  const erros = estado.fieldErrors ?? {};

  return (
    <form action={acao} className="space-y-5" noValidate>
      {estado.message && <Alert tom="perigo">{estado.message}</Alert>}
      <Field id="senha" label="Nova senha" erro={erros.senha} dica="Mínimo 8 caracteres, com letras e números." obrigatorio>
        <PasswordInput id="senha" name="senha" autoComplete="new-password" erro={erros.senha} required />
      </Field>
      <Field id="confirmacao" label="Confirme a nova senha" erro={erros.confirmacao} obrigatorio>
        <PasswordInput id="confirmacao" name="confirmacao" autoComplete="new-password" erro={erros.confirmacao} required />
      </Field>
      <Button type="submit" tamanho="lg" className="w-full" carregando={pendente} icone={<KeyRound className="size-4" aria-hidden />}>
        {pendente ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
