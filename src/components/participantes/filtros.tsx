"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Select } from "@/components/ui/field";
import { CATEGORIAS, UFS } from "@/lib/constants";

/**
 * Pesquisa em tempo real (com debounce de 300 ms) + filtros.
 * O estado fica na URL, então a busca pode ser compartilhada e sobrevive ao recarregar.
 */
export function FiltrosParticipantes() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendente, startTransition] = useTransition();
  const [termo, setTermo] = useState(params.get("q") ?? "");
  const primeiraRenderizacao = useRef(true);

  function atualizar(mudancas: Record<string, string>) {
    const novos = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) novos.set(k, v);
      else novos.delete(k);
    }
    novos.delete("pagina"); // qualquer filtro novo volta para a página 1
    const qs = novos.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const t = setTimeout(() => atualizar({ q: termo.trim() }), 300);
    return () => clearTimeout(t);
  }, [termo]); // eslint-disable-line react-hooks/exhaustive-deps

  const temFiltros = Boolean(params.get("q") || params.get("categoria") || params.get("estado") || params.get("tipo"));

  return (
    <div className="mb-5 space-y-3">
      <div className="relative">
        <label htmlFor="busca" className="sr-only">
          Pesquisar participantes
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          id="busca"
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome, razão social, fantasia, CPF/CNPJ ou cidade"
          className="input-base py-3 pr-10 pl-10"
          autoComplete="off"
        />
        {pendente && (
          <Loader2 className="absolute top-1/2 right-3 size-5 -translate-y-1/2 animate-spin text-brand-500" aria-label="Pesquisando" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select
          aria-label="Filtrar por tipo"
          value={params.get("tipo") ?? ""}
          onChange={(e) => atualizar({ tipo: e.target.value })}
          className="sm:w-auto"
        >
          <option value="">Tipos</option>
          <option value="PJ">Empresas (CNPJ)</option>
          <option value="PF">Pessoas (CPF)</option>
        </Select>
        <Select
          aria-label="Filtrar por categoria"
          value={params.get("categoria") ?? ""}
          onChange={(e) => atualizar({ categoria: e.target.value })}
          className="sm:w-auto"
        >
          <option value="">Categorias</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por estado"
          value={params.get("estado") ?? ""}
          onChange={(e) => atualizar({ estado: e.target.value })}
          className="sm:w-auto"
        >
          <option value="">Estados (UF)</option>
          {UFS.map((uf) => (
            <option key={uf.sigla} value={uf.sigla}>
              {uf.sigla} — {uf.nome}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Ordenar"
          value={params.get("ordem") ?? ""}
          onChange={(e) => atualizar({ ordem: e.target.value })}
          className="sm:w-auto"
        >
          <option value="">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
          <option value="nome">Nome (A–Z)</option>
        </Select>
        {temFiltros && (
          <button
            type="button"
            onClick={() => {
              setTermo("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:col-span-1 sm:min-h-10"
          >
            <X className="size-4" aria-hidden /> Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
