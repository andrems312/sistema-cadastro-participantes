"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { recuperarSenha } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import type { FormState } from "@/types/database";

const inicial: FormState = { ok: false };

export function RecoverForm() {
  const [estado, acao, pendente] = useActionState(recuperarSenha, inicial);
  const erros = estado.fieldErrors ?? {};

  return (
    <div className="space-y-5">
      {estado.ok ? (
        <Alert tom="sucesso" titulo="Verifique seu e-mail">
          {estado.message}
        </Alert>
      ) : (
        <form action={acao} className="space-y-5" noValidate>
          {estado.message && <Alert tom="perigo">{estado.message}</Alert>}
          <Field id="email" label="E-mail" erro={erros.email} obrigatorio>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={estado.valores?.email}
              erro={erros.email}
              required
            />
          </Field>
          <Button type="submit" tamanho="lg" className="w-full" carregando={pendente} icone={<Mail className="size-4" aria-hidden />}>
            {pendente ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      )}
      <Link href="/login" className="flex items-center justify-center gap-1 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para o login
      </Link>
    </div>
  );
}
