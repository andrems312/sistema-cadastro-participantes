"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { salvarOrganizacao } from "@/actions/configuracoes";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { FormState } from "@/types/database";

export function OrganizacaoForm({ nomeAtual }: { nomeAtual: string }) {
  const [estado, acao, pendente] = useActionState(salvarOrganizacao, { ok: false } as FormState);
  const erros = estado.fieldErrors ?? {};

  useEffect(() => {
    if (estado.ok) toast.success(estado.message ?? "Salvo.");
    else if (estado.message) toast.error(estado.message);
  }, [estado]);

  return (
    <form action={acao} className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
      <Field id="nome_organizacao" label="Nome da organização / sistema" erro={erros.nome_organizacao} className="flex-1">
        <Input
          id="nome_organizacao"
          name="nome_organizacao"
          defaultValue={estado.valores?.nome_organizacao ?? nomeAtual}
          erro={erros.nome_organizacao}
          maxLength={80}
        />
      </Field>
      <Button type="submit" carregando={pendente} icone={<Save className="size-4" aria-hidden />}>
        Salvar
      </Button>
    </form>
  );
}
