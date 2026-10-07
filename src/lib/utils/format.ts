const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });

export function formatarDataHora(iso: string | null | undefined): string {
  return iso ? dataHora.format(new Date(iso)) : "—";
}

export function formatarData(iso: string | null | undefined): string {
  return iso ? data.format(new Date(iso)) : "—";
}

export function formatarNumero(n: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR").format(n ?? 0);
}

/** Endereço em uma linha: "Rua X, 123 - Compl, Bairro, Cidade - UF, 00000-000". */
export function montarEndereco(p: {
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}): string {
  const rua = [p.endereco, p.numero].filter(Boolean).join(", ");
  const ruaCompl = [rua, p.complemento].filter(Boolean).join(" - ");
  const cidadeUf = [p.cidade, p.estado].filter(Boolean).join(" - ");
  const cep = p.cep ? p.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2") : "";
  return [ruaCompl, p.bairro, cidadeUf, cep].filter(Boolean).join(", ");
}

export function iniciais(nome: string): string {
  return nome
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Link para abrir as coordenadas no OpenStreetMap. */
export function linkMapa(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}
