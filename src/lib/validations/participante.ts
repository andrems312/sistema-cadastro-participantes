import { z } from "zod";
import { CATEGORIAS, SIGLAS_UF } from "@/lib/constants";
import { somenteDigitos, tipoDocumento, validarCpfCnpj } from "@/lib/validations/documentos";

/** Texto opcional: aparado; vazio vira null. */
const textoOpcional = (max: number, rotulo: string) =>
  z
    .string()
    .trim()
    .max(max, `${rotulo}: máximo de ${max} caracteres.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const coordenada = (min: number, max: number) =>
  z
    .number()
    .min(min)
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (typeof v === "number" && Number.isFinite(v) ? v : null));

/**
 * Esquema do participante — o MESMO esquema valida no navegador (feedback imediato)
 * e no servidor (server action), garantindo validação nas duas pontas.
 * O banco ainda aplica CHECK constraints como última barreira.
 */
export const participanteSchema = z
  .object({
    cpf_cnpj: z
      .string({ required_error: "Informe o CPF ou CNPJ." })
      .transform(somenteDigitos)
      .refine((v) => v.length > 0, "Informe o CPF ou CNPJ.")
      .refine((v) => v.length === 11 || v.length === 14, "CPF deve ter 11 dígitos e CNPJ 14 dígitos.")
      .refine(validarCpfCnpj, (v) => ({ message: `${tipoDocumento(v) ?? "Documento"} inválido. Confira os dígitos.` })),
    nome: z
      .string({ required_error: "Informe o nome completo ou a razão social." })
      .trim()
      .min(2, "Informe o nome completo ou a razão social.")
      .max(200, "Nome: máximo de 200 caracteres."),
    nome_fantasia: textoOpcional(200, "Nome fantasia"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(200, "E-mail muito longo.")
      .refine((v) => v === "" || z.string().email().safeParse(v).success, "Informe um e-mail válido.")
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    telefone: z
      .string()
      .optional()
      .nullable()
      .transform((v) => somenteDigitos(v) || null)
      .refine((v) => v === null || v.length === 10 || v.length === 11, "Telefone deve ter DDD + 8 ou 9 dígitos."),
    cep: z
      .string()
      .optional()
      .nullable()
      .transform((v) => somenteDigitos(v) || null)
      .refine((v) => v === null || v.length === 8, "CEP deve ter 8 dígitos."),
    endereco: textoOpcional(200, "Endereço"),
    numero: textoOpcional(20, "Número"),
    complemento: textoOpcional(100, "Complemento"),
    bairro: textoOpcional(100, "Bairro"),
    cidade: z.string({ required_error: "Informe a cidade." }).trim().min(2, "Informe a cidade.").max(100),
    estado: z
      .string({ required_error: "Selecione o estado." })
      .trim()
      .toUpperCase()
      .refine((v) => SIGLAS_UF.includes(v), "Selecione o estado."),
    categoria: z.enum(CATEGORIAS, { errorMap: () => ({ message: "Selecione uma categoria." }) }),
    latitude: coordenada(-90, 90),
    longitude: coordenada(-180, 180),
    imagem_path: z.string().max(500).optional().nullable().transform((v) => v || null),
    observacoes: textoOpcional(2000, "Observações"),
  })
  .transform((d) => ({
    ...d,
    // lat/lng sempre juntos
    latitude: d.latitude !== null && d.longitude !== null ? d.latitude : null,
    longitude: d.latitude !== null && d.longitude !== null ? d.longitude : null,
  }));

export type ParticipanteEntrada = z.input<typeof participanteSchema>;
export type ParticipanteValidado = z.output<typeof participanteSchema>;
