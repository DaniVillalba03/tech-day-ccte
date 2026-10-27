/** Operaciones puras e inmutables sobre listas (cuerpos del cohete). */

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function replaceAt<T>(list: readonly T[], index: number, value: T): T[] {
  return list.map((v, i) => (i === index ? value : v));
}

export function insertAt<T>(list: readonly T[], index: number, value: T): T[] {
  const next = [...list];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, value);
  return next;
}

/** Mueve el elemento `from` a la posición `to` (límites ajustados). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list];
  const target = Math.max(0, Math.min(to, list.length - 1));
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item);
  return next;
}
