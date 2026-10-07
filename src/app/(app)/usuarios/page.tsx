import type { Metadata } from "next";
import { UserPlus, Users } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { NovoUsuarioForm } from "@/components/usuarios/novo-usuario-form";
import { TabelaUsuarios } from "@/components/usuarios/tabela-usuarios";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import type { Usuario } from "@/types/database";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  const sessao = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("tipo_solicitado", { ascending: true }) // 'admin' < 'usuario': solicitações primeiro
    .order("criado_em", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os usuários.");

  const usuarios = (data ?? []) as Usuario[];
  const pendentes = usuarios.filter((u) => u.tipo_solicitado === "admin" && u.tipo_acesso !== "admin").length;
  const admins = usuarios.filter((u) => u.tipo_acesso === "admin").length;

  return (
    <>
      <PageHeader
        titulo="Gerenciamento de usuários"
        descricao={`${usuarios.length} usuários · ${admins} administrador(es)${pendentes ? ` · ${pendentes} solicitação(ões) pendente(s)` : ""}`}
      />

      <Card className="mb-6">
        <CardHeader
          titulo="Novo acesso"
          descricao="Crie o acesso já com o nível desejado. O usuário poderá trocar a senha em “Esqueci minha senha”."
          icone={<UserPlus className="size-5" aria-hidden />}
        />
        <CardBody>
          <NovoUsuarioForm habilitado={Boolean(serverEnv.supabaseServiceRoleKey)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader titulo="Usuários cadastrados" icone={<Users className="size-5" aria-hidden />} />
        <TabelaUsuarios usuarios={usuarios} idAtual={sessao.user.id} />
      </Card>
    </>
  );
}
