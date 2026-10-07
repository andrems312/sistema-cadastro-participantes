import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail.")
  .max(200, "E-mail muito longo.")
  .email("Informe um e-mail válido.");

export const senhaForteSchema = z
  .string({ required_error: "Informe a senha." })
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "A senha deve conter pelo menos uma letra.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.");

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, "Informe a senha."),
});

export const tipoAcessoSchema = z.enum(["admin", "usuario"], {
  errorMap: () => ({ message: "Selecione o tipo de acesso." }),
});

export const nomeSchema = z
  .string({ required_error: "Informe o nome completo." })
  .trim()
  .min(3, "Informe o nome completo.")
  .max(120, "Nome muito longo.");

export const criarAcessoSchema = z
  .object({
    nome: nomeSchema,
    email: emailSchema,
    senha: senhaForteSchema,
    confirmacao: z.string().min(1, "Confirme a senha."),
    tipo_acesso: tipoAcessoSchema,
  })
  .refine((d) => d.senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não conferem.",
  });

export const recuperarSenhaSchema = z.object({ email: emailSchema });

export const redefinirSenhaSchema = z
  .object({
    senha: senhaForteSchema,
    confirmacao: z.string().min(1, "Confirme a senha."),
  })
  .refine((d) => d.senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não conferem.",
  });

/** Converte erros do Zod em { campo: mensagem } (primeira mensagem de cada campo). */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = issue.path.join(".") || "_";
    if (!resultado[campo]) resultado[campo] = issue.message;
  }
  return resultado;
}
