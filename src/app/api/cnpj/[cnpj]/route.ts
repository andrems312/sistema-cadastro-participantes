import { NextResponse } from "next/server";
import { autenticarApi, erroJson } from "@/lib/auth/api";
import { serverEnv } from "@/lib/env";
import { consultarCnpj, ErroConsultaCnpj } from "@/lib/services/cnpj";
import { verificarLimite } from "@/lib/services/rate-limit";
import { somenteDigitos, validarCNPJ } from "@/lib/validations/documentos";

export const dynamic = "force-dynamic";

/** GET /api/cnpj/:cnpj — consulta o CNPJ na API pública (BrasilAPI) pelo servidor. */
export async function GET(_req: Request, { params }: { params: Promise<{ cnpj: string }> }) {
  const auth = await autenticarApi();
  if (!auth) return erroJson("Sessão expirada. Entre novamente.", 401);

  const { cnpj: bruto } = await params;
  const cnpj = somenteDigitos(decodeURIComponent(bruto));
  if (!validarCNPJ(cnpj)) return erroJson("CNPJ inválido.", 400);

  const limite = verificarLimite(`cnpj:${auth.user.id}`, serverEnv.cnpjRateLimitPerMinute);
  if (!limite.permitido) {
    return erroJson(`Muitas consultas seguidas. Aguarde ${limite.aguardarSegundos}s e tente novamente.`, 429, {
      aguardarSegundos: limite.aguardarSegundos,
    });
  }

  try {
    const dados = await consultarCnpj(cnpj);
    return NextResponse.json({ dados }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (e) {
    if (e instanceof ErroConsultaCnpj) return erroJson(e.message, e.status);
    console.error("[api/cnpj]", e);
    return erroJson("Erro ao consultar serviço de CNPJ.", 502);
  }
}
