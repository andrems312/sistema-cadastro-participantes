"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";

// O Leaflet acessa `window` ao ser importado: carrega somente no navegador.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-slate-100" aria-label="Carregando mapa" />,
});

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  /** Quando informado, o marcador pode ser arrastado para ajustar a posição. */
  onMover?: (latitude: number, longitude: number) => void;
  titulo?: string;
  className?: string;
}

/** Mapa do OpenStreetMap (Leaflet) — gratuito, não exige chave de API. */
export function LocationMap({ latitude, longitude, onMover, titulo, className }: LocationMapProps) {
  const posicao: [number, number] | null = latitude !== null && longitude !== null ? [latitude, longitude] : null;

  return (
    <div className={cn("relative z-0 h-72 overflow-hidden rounded-xl border border-slate-200 sm:h-80", className)}>
      <LeafletMap posicao={posicao} onMover={onMover} titulo={titulo} />
    </div>
  );
}
