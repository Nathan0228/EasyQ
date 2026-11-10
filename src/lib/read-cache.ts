// Public reads only: short-lived, bounded and never persisted to browser storage.
export function createReadCache<T>(ttl = 60000, capacity = 20) {
  const values = new Map<string, { value: T; expires: number }>();
  const pending = new Map<string, Promise<T>>();
  let generation = 0;
  function peek(key: string): T | undefined {
    const entry = values.get(key);
    if (!entry) return undefined;
    if (entry.expires <= Date.now()) { values.delete(key); return undefined; }
    return entry.value;
  }
  function get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = peek(key);
    if (cached !== undefined) return Promise.resolve(cached);
    const existing = pending.get(key);
    if (existing) return existing;
    const started = generation;
    const request = Promise.resolve().then(load).then(value => {
      if (generation === started) {
        values.delete(key);
        values.set(key, { value, expires: Date.now() + ttl });
        while (values.size > capacity) values.delete(values.keys().next().value!);
      }
      return value;
    }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
    pending.set(key, request);
    return request;
  }
  return { peek, get, clear() { generation++; values.clear(); pending.clear(); } };
}
