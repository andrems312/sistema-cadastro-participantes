"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";

const CENTRO_BRASIL: L.LatLngTuple = [-14.235, -51.9253];

// Marcador em SVG (evita os ícones PNG padrão do Leaflet, que não são encontrados pelo bundler)
const ICONE = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" aria-hidden="true">
    <path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="#2647ea" stroke="#1f2d89" stroke-width="2"/>
    <circle cx="16" cy="15.5" r="5.5" fill="#ffffff"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 41],
  tooltipAnchor: [0, -38],
});

interface LeafletMapProps {
  posicao: L.LatLngTuple | null;
  onMover?: (latitude: number, longitude: number) => void;
  titulo?: string;
}

/** Recentraliza o mapa quando as coordenadas mudam (ex.: após "Localizar no mapa"). */
function Recentralizar({ posicao }: { posicao: L.LatLngTuple | null }) {
  const map = useMap();
  useEffect(() => {
    if (!posicao) return;
    map.setView(posicao, Math.max(map.getZoom(), 16));
  }, [map, posicao?.[0], posicao?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LeafletMap({ posicao, onMover, titulo }: LeafletMapProps) {
  const eventos = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({
      dragend(e) {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        onMover?.(lat, lng);
      },
    }),
    [onMover],
  );

  return (
    <MapContainer
      center={posicao ?? CENTRO_BRASIL}
      zoom={posicao ? 16 : 4}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Recentralizar posicao={posicao} />
      {posicao && (
        <Marker position={posicao} icon={ICONE} draggable={Boolean(onMover)} eventHandlers={eventos} keyboard>
          <Tooltip>{titulo ?? "Localização do participante"}</Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
