import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { LogoUpload } from "@/components/configuracoes/logo-upload";
import { requireAdmin } from "@/lib/auth/session";
import { getConfiguracoes } from "@/lib/services/configuracoes";

export const metadata: Metadata = { title: "Logo do sistema" };

export default async function LogoPage() {
  await requireAdmin();
  const config = await getConfiguracoes();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/configuracoes" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para configurações
      </Link>
      <PageHeader titulo="Logo do sistema" descricao="A imagem é salva no armazenamento em nuvem (Supabase Storage)." />
      <Card>
        <CardHeader titulo="Upload / alteração de logo" icone={<ImageIcon className="size-5" aria-hidden />} />
        <CardBody>
          <LogoUpload logoAtual={config.logo_url} nome={config.nome_organizacao} />
        </CardBody>
      </Card>
    </div>
  );
}
