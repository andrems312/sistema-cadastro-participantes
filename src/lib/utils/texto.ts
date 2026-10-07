const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos", "a", "o"]);

/** "AVENIDA DAS NACOES UNIDAS" → "Avenida das Nacoes Unidas" (APIs públicas costumam devolver tudo em maiúsculas). */
export function capitalizar(valor: string | null | undefined): string {
  if (!valor) return "";
  return valor
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra, i) =>
      i > 0 && MINUSCULAS.has(palavra) ? palavra : palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1),
    )
    .join(" ");
}

/** Remove caracteres que quebram filtros do PostgREST e limita o tamanho do termo de busca. */
export function sanitizarBusca(valor: string | null | undefined): string {
  return (valor ?? "")
    .replace(/[%_,()*\\"'`:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
