import { UPLOAD } from "@/lib/constants";

export type TipoImagem = (typeof UPLOAD.tiposPermitidos)[number];

export const EXTENSAO_POR_TIPO: Record<TipoImagem, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function formatarMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/** Validação rápida (tipo declarado + tamanho) — usada no navegador e no servidor. */
export function validarArquivoImagem(arquivo: { type: string; size: number }, maxBytes: number): string | null {
  if (!(UPLOAD.tiposPermitidos as readonly string[]).includes(arquivo.type)) {
    return "Formato inválido. Envie uma imagem JPG, JPEG, PNG ou WEBP.";
  }
  if (arquivo.size === 0) return "O arquivo está vazio.";
  if (arquivo.size > maxBytes) {
    return `Imagem muito grande (${formatarMB(arquivo.size)}). O tamanho máximo é ${formatarMB(maxBytes)}.`;
  }
  return null;
}

/**
 * Identifica o tipo real do arquivo pelos "magic bytes" (assinatura binária),
 * impedindo que um arquivo qualquer seja enviado apenas renomeando a extensão.
 */
export function detectarTipoImagem(bytes: Uint8Array): TipoImagem | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  ) {
    return "image/webp";
  }
  return null;
}
