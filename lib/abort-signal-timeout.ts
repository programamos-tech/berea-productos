/**
 * Combina un timeout con un AbortSignal externo (p. ej. cleanup de useEffect).
 * Evita búsquedas del POS colgadas en "Buscando…" si la red/Auth no responde.
 */
export function abortSignalWithTimeout(
  timeoutMs: number,
  outer?: AbortSignal | null,
): { signal: AbortSignal; cleanup: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => {
    ctrl.abort();
  }, timeoutMs);

  const onOuterAbort = () => {
    ctrl.abort();
  };

  if (outer) {
    if (outer.aborted) {
      ctrl.abort();
    } else {
      outer.addEventListener("abort", onOuterAbort, { once: true });
    }
  }

  return {
    signal: ctrl.signal,
    cleanup: () => {
      clearTimeout(timer);
      outer?.removeEventListener("abort", onOuterAbort);
    },
  };
}

export const ADMIN_SEARCH_TIMEOUT_MS = 8_000;
