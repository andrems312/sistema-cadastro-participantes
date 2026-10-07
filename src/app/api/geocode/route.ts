import { NextResponse, type NextRequest } from "next/server";
import { autenticarApi, erroJson } from "@/lib/auth/api";
import { ErroGeocodificacao, geocodificarEndereco, type PartesEndereco } from "@/lib/services/geocoding";
import { verificarLimite } from "@/lib/services/rate-limit";

export const dynamic = "force-dynamic";

const CAMPOS = ["endereco", "numero", "bairro", "cidade", "estado", "cep"] as const;

/**
 * GET /api/geocode?endereco=&numero=&bairro=&cidade=&estado=&cep=
 * Converte o endereço em latitude/longitude (OpenStreetMap / Nominatim).
 */
export async function GET(request: NextRequest) {
  const auth = await autenticarApi();
  if (!auth) return erroJson("Sessão expirada. Entre novamente.", 401);

  const partes: PartesEndereco = {};
  for (const campo of CAMPOS) {
    partes[campo] = (request.nextUrl.searchParams.get(campo) ?? "").trim().slice(0, 200);
  }
  if (!partes.cidade && !partes.cep) return erroJson("Informe ao menos a cidade e o estado.", 400);

  const limite = verificarLimite(`geocode:${auth.user.id}`, 30);
  if (!limite.permitido) return erroJson(`Muitas consultas. Aguarde ${limite.aguardarSegundos}s.`, 429);

  try {
    const resultado = await geocodificarEndereco(partes);
    if (!resultado) return erroJson("Endereço não encontrado no mapa. Confira os dados ou ajuste o marcador.", 404);
    return NextResponse.json({ resultado });
  } catch (e) {
    const msg = e instanceof ErroGeocodificacao ? e.message : "Erro no serviço de mapas.";
    return erroJson(msg, 502);
  }
}
