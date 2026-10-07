/**
 * Validação de CPF e CNPJ pelos dígitos verificadores (algoritmo oficial da Receita Federal).
 * Funções puras — usadas no frontend, no backend (server actions / API routes) e nos testes.
 */

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

function todosDigitosIguais(doc: string): boolean {
  return /^(\d)\1+$/.test(doc);
}

export function validarCPF(valor: string): boolean {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || todosDigitosIguais(cpf)) return false;

  const calcularDigito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calcularDigito(cpf.slice(0, 9), 10);
  const d2 = calcularDigito(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function validarCNPJ(valor: string): boolean {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || todosDigitosIguais(cnpj)) return false;

  const calcularDigito = (base: string) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcularDigito(cnpj.slice(0, 12));
  const d2 = calcularDigito(cnpj.slice(0, 13));
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

export type TipoDocumento = "CPF" | "CNPJ";

export function tipoDocumento(valor: string): TipoDocumento | null {
  const doc = somenteDigitos(valor);
  if (doc.length === 11) return "CPF";
  if (doc.length === 14) return "CNPJ";
  return null;
}

export function validarCpfCnpj(valor: string): boolean {
  const tipo = tipoDocumento(valor);
  if (tipo === "CPF") return validarCPF(valor);
  if (tipo === "CNPJ") return validarCNPJ(valor);
  return false;
}
