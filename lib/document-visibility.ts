/**
 * Helpers for pausing background work while the browser tab is hidden.
 * After long idle, wake-up storms (poll + auth + realtime) make the admin feel stuck.
 */

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

/** Cap a Set to the most recently added keys (approx: keep insertion order). */
export function trimSet(set: Set<string>, max: number): void {
  if (set.size <= max) return;
  const overflow = set.size - max;
  let i = 0;
  for (const key of set) {
    if (i >= overflow) break;
    set.delete(key);
    i += 1;
  }
}
