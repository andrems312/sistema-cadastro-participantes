export const CATEGORIAS = [
  "Empresa",
  "Cliente",
  "Fornecedor",
  "Parceiro",
  "Patrocinador",
  "Expositor",
  "Palestrante",
  "Visitante",
  "Outro",
] as const;

export const UFS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
] as const;

export const SIGLAS_UF: readonly string[] = UFS.map((u) => u.sigla);

/** Limites de upload (também aplicados nos buckets do Storage). */
export const UPLOAD = {
  tiposPermitidos: ["image/jpeg", "image/png", "image/webp"] as const,
  extensoes: ".jpg,.jpeg,.png,.webp",
  maxBytesParticipante: 5 * 1024 * 1024, // 5 MB
  maxBytesLogo: 2 * 1024 * 1024, // 2 MB
} as const;

export const BUCKETS = {
  participantes: "participantes",
  branding: "branding",
} as const;

export const ITENS_POR_PAGINA = 12;

export const ROTAS_PUBLICAS = ["/login", "/criar-acesso", "/recuperar-senha", "/auth"];
export const ROTAS_ADMIN = ["/usuarios", "/configuracoes"];
