/**
 * Máscaras de entrada (aplicadas enquanto o usuário digita) e formatação para exibição.
 * O banco sempre armazena apenas dígitos.
 */
import { somenteDigitos } from "@/lib/validations/documentos";

export function mascaraCPF(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function mascaraCNPJ(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Decide a máscara pelo tamanho: até 11 dígitos = CPF, acima = CNPJ. */
export function mascaraCpfCnpj(valor: string): string {
  const d = somenteDigitos(valor);
  return d.length <= 11 ? mascaraCPF(d) : mascaraCNPJ(d);
}

export function mascaraCEP(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}

/** (11) 3456-7890 para fixo e (11) 98765-4321 para celular. */
export function mascaraTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarDocumento(valor: string | null | undefined): string {
  if (!valor) return "—";
  return mascaraCpfCnpj(valor);
}

export function formatarTelefone(valor: string | null | undefined): string {
  return valor ? mascaraTelefone(valor) : "—";
}

export function formatarCEP(valor: string | null | undefined): string {
  return valor ? mascaraCEP(valor) : "—";
}
