import "server-only";

/**
 * Limitador de requisições simples (janela deslizante, em memória).
 * Suficiente para um servidor Node ou para cada instância serverless.
 * Para múltiplas instâncias com limite global, troque por Redis/Upstash.
 */
const janelas = new Map<string, number[]>();

export function verificarLimite(chave: string, limite: number, janelaMs = 60_000) {
  const agora = Date.now();
  const recentes = (janelas.get(chave) ?? []).filter((t) => agora - t < janelaMs);

  if (recentes.length >= limite) {
    const esperarMs = janelaMs - (agora - recentes[0]);
    janelas.set(chave, recentes);
    return { permitido: false as const, aguardarSegundos: Math.ceil(esperarMs / 1000) };
  }

  recentes.push(agora);
  janelas.set(chave, recentes);

  // limpeza ocasional para não crescer indefinidamente
  if (janelas.size > 5000) {
    for (const [k, v] of janelas) if (!v.some((t) => agora - t < janelaMs)) janelas.delete(k);
  }
  return { permitido: true as const, restantes: limite - recentes.length };
}
