import { NextResponse } from "next/server";
import { autenticarApi, erroJson } from "@/lib/auth/api";
import { consultarCep } from "@/lib/services/cep";
import { verificarLimite } from "@/lib/services/rate-limit";
import { somenteDigitos } from "@/lib/validations/documentos";

export const dynamic = "force-dynamic";

/** GET /api/cep/:cep — busca o endereço pelo CEP (BrasilAPI). */
export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const auth = await autenticarApi();
  if (!auth) return erroJson("Sessão expirada. Entre novamente.", 401);

  const { cep: bruto } = await params;
  const cep = somenteDigitos(decodeURIComponent(bruto));
  if (cep.length !== 8) return erroJson("CEP inválido.", 400);

  const limite = verificarLimite(`cep:${auth.user.id}`, 30);
  if (!limite.permitido) return erroJson(`Muitas consultas. Aguarde ${limite.aguardarSegundos}s.`, 429);

  try {
    const dados = await consultarCep(cep);
    if (!dados) return erroJson("CEP não encontrado.", 404);
    return NextResponse.json({ dados });
  } catch (e) {
    console.error("[api/cep]", e);
    return erroJson("Erro ao consultar serviço de CEP.", 502);
  }
}
