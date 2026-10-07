"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const AVISOS: Record<string, { tipo: "success" | "error" | "info"; texto: string }> = {
  "bem-vindo": { tipo: "success", texto: "Acesso criado com sucesso! Bem-vindo(a)." },
  "senha-alterada": { tipo: "success", texto: "Senha alterada com sucesso." },
  permissao: { tipo: "error", texto: "Você não tem permissão para acessar essa área." },
};

/** Mostra um toast a partir de ?aviso= ou ?erro= (usado após redirecionamentos) e limpa a URL. */
export function AvisoUrl() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const exibido = useRef(false);

  useEffect(() => {
    const chave = params.get("aviso") ?? params.get("erro");
    if (!chave || exibido.current) return;
    const aviso = AVISOS[chave];
    if (aviso) {
      exibido.current = true;
      toast[aviso.tipo](aviso.texto);
    }
    router.replace(pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
