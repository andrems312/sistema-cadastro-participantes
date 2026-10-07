"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { criarUsuario } from "@/actions/usuarios";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";
import type { FormState } from "@/types/database";

const inicial: FormState = { ok: false };

export function NovoUsuarioForm({ habilitado }: { habilitado: boolean }) {
  const [estado, acao, pendente] = useActionState(criarUsuario, inicial);
  const formRef = useRef<HTMLFormElement>(null);
  const erros = estado.fieldErrors ?? {};
  const v = estado.valores ?? {};

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.message ?? "Acesso criado.");
      formRef.current?.reset();
    }
  }, [estado]);

  return (
    <form ref={formRef} action={acao} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" noValidate>
      {!habilitado && (
        <Alert tom="alerta" className="sm:col-span-2 lg:col-span-4">
          Configure <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor para criar e excluir usuários pelo painel. Enquanto
          isso, novos usuários podem se cadastrar em “Criar acesso”.
        </Alert>
      )}
      {!estado.ok && estado.message && (
        <Alert tom="perigo" className="sm:col-span-2 lg:col-span-4">
          {estado.message}
        </Alert>
      )}
      <Field id="novo-nome" label="Nome completo" erro={erros.nome} obrigatorio>
        <Input id="novo-nome" name="nome" defaultValue={v.nome} erro={erros.nome} disabled={!habilitado} />
      </Field>
      <Field id="novo-email" label="E-mail" erro={erros.email} obrigatorio>
        <Input id="novo-email" name="email" type="email" defaultValue={v.email} erro={erros.email} disabled={!habilitado} />
      </Field>
      <Field id="novo-senha" label="Senha inicial" erro={erros.senha} dica="Mín. 8 caracteres, letras e números." obrigatorio>
        <PasswordInput id="novo-senha" name="senha" autoComplete="new-password" erro={erros.senha} disabled={!habilitado} />
      </Field>
      <Field id="novo-tipo" label="Tipo de acesso" erro={erros.tipo_acesso} obrigatorio>
        <Select id="novo-tipo" name="tipo_acesso" defaultValue={v.tipo_acesso || "usuario"} erro={erros.tipo_acesso} disabled={!habilitado}>
          <option value="usuario">Usuário</option>
          <option value="admin">Administrador</option>
        </Select>
      </Field>
      <div className="sm:col-span-2 lg:col-span-4">
        <Button type="submit" carregando={pendente} disabled={!habilitado} icone={<UserPlus className="size-4" aria-hidden />}>
          {pendente ? "Criando..." : "Criar acesso"}
        </Button>
      </div>
    </form>
  );
}
