import { NextResponse, type NextRequest } from "next/server";
import { autenticarApi, erroJson } from "@/lib/auth/api";
import { BUCKETS, UPLOAD } from "@/lib/constants";
import { verificarLimite } from "@/lib/services/rate-limit";
import { detectarTipoImagem, EXTENSAO_POR_TIPO, validarArquivoImagem } from "@/lib/validations/upload";

export const dynamic = "force-dynamic";

type Destino = "participante" | "logo";

/**
 * POST /api/upload  (multipart/form-data: arquivo, destino)
 * Valida e envia a imagem ao Supabase Storage. Retorna { path, url }.
 * O vínculo com o participante/logo é salvo depois, pela server action correspondente.
 */
export async function POST(request: NextRequest) {
  const auth = await autenticarApi();
  if (!auth) return erroJson("Sessão expirada. Entre novamente.", 401);

  const limite = verificarLimite(`upload:${auth.user.id}`, 20);
  if (!limite.permitido) return erroJson(`Muitos envios. Aguarde ${limite.aguardarSegundos}s.`, 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return erroJson("Envio inválido.", 400);
  }

  const destino = form.get("destino") as Destino | null;
  const arquivo = form.get("arquivo");
  if (destino !== "participante" && destino !== "logo") return erroJson("Destino inválido.", 400);
  if (!(arquivo instanceof File)) return erroJson("Selecione uma imagem.", 400);

  if (destino === "logo" && auth.tipo !== "admin") {
    return erroJson("Somente administradores podem alterar a logo.", 403);
  }

  const maxBytes = destino === "logo" ? UPLOAD.maxBytesLogo : UPLOAD.maxBytesParticipante;
  const erroValidacao = validarArquivoImagem(arquivo, maxBytes);
  if (erroValidacao) return erroJson(erroValidacao, 400);

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipoReal = detectarTipoImagem(bytes);
  if (!tipoReal) return erroJson("O arquivo não é uma imagem válida (JPG, PNG ou WEBP).", 400);

  const extensao = EXTENSAO_POR_TIPO[tipoReal];
  const bucket = destino === "logo" ? BUCKETS.branding : BUCKETS.participantes;
  const path =
    destino === "logo" ? `logo-${Date.now()}.${extensao}` : `${auth.user.id}/${crypto.randomUUID()}.${extensao}`;

  const { error } = await auth.supabase.storage.from(bucket).upload(path, bytes, {
    contentType: tipoReal,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[api/upload]", error);
    return erroJson("Não foi possível enviar a imagem. Tente novamente.", 500);
  }

  const { data } = auth.supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ path, url: data.publicUrl }, { status: 201 });
}

/**
 * DELETE /api/upload?path=...
 * Remove uma imagem de participante enviada pelo próprio usuário que não chegou a ser salva
 * (ex.: o cadastro falhou ou foi cancelado). As políticas do Storage reforçam a regra.
 */
export async function DELETE(request: NextRequest) {
  const auth = await autenticarApi();
  if (!auth) return erroJson("Sessão expirada. Entre novamente.", 401);

  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!path.startsWith(`${auth.user.id}/`) || path.includes("..")) return erroJson("Caminho inválido.", 400);

  const { count } = await auth.supabase
    .from("participantes")
    .select("id", { count: "exact", head: true })
    .eq("imagem_path", path);
  if (count) return erroJson("Imagem vinculada a um participante.", 409);

  await auth.supabase.storage.from(BUCKETS.participantes).remove([path]);
  return new NextResponse(null, { status: 204 });
}
