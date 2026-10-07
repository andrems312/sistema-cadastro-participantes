/**
 * Converte erros técnicos (Supabase Auth / PostgREST / Postgres) em mensagens amigáveis.
 */

const MENSAGENS_AUTH: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  user_already_exists: "Já existe um acesso cadastrado com este e-mail.",
  email_exists: "Já existe um acesso cadastrado com este e-mail.",
  weak_password: "Senha fraca. Use pelo menos 8 caracteres, com letras e números.",
  over_email_send_rate_limit: "Muitos e-mails enviados. Aguarde alguns minutos e tente novamente.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
  same_password: "A nova senha deve ser diferente da senha atual.",
  signup_disabled: "O cadastro de novos acessos está desativado.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  otp_expired: "O link expirou ou já foi usado. Solicite um novo.",
};

type ErroComCodigo = { code?: string; message?: string; status?: number } | null | undefined;

export function mensagemErroAuth(erro: ErroComCodigo): string {
  if (!erro) return "Ocorreu um erro inesperado. Tente novamente.";
  if (erro.code && MENSAGENS_AUTH[erro.code]) return MENSAGENS_AUTH[erro.code];

  const msg = (erro.message ?? "").toLowerCase();
  if (msg.includes("invalid login credentials")) return MENSAGENS_AUTH.invalid_credentials;
  if (msg.includes("email not confirmed")) return MENSAGENS_AUTH.email_not_confirmed;
  if (msg.includes("already registered")) return MENSAGENS_AUTH.user_already_exists;
  if (msg.includes("rate limit")) return MENSAGENS_AUTH.over_request_rate_limit;
  if (msg.includes("password")) return "Senha inválida. Use pelo menos 8 caracteres, com letras e números.";
  if (msg.includes("fetch failed") || msg.includes("network")) {
    return "Não foi possível conectar ao servidor de autenticação. Verifique sua conexão.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function mensagemErroBanco(erro: ErroComCodigo): string {
  if (!erro) return "Ocorreu um erro inesperado. Tente novamente.";
  switch (erro.code) {
    case "23505":
      if ((erro.message ?? "").includes("cpf_cnpj")) return "Já existe um participante cadastrado com este CPF/CNPJ.";
      return "Registro duplicado.";
    case "23514":
      return "Alguns dados não passaram na validação. Revise o formulário.";
    case "42501":
      return "Você não tem permissão para realizar esta operação.";
    case "P0001":
      return erro.message ?? "Operação não permitida.";
    case "PGRST116":
      return "Registro não encontrado.";
    default:
      return "Não foi possível salvar os dados. Tente novamente.";
  }
}
