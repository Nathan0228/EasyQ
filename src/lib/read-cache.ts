export type CacheStorage = {
  read: () => string | null;
  write: (value: string) => void;
  remove: () => void;
};
type Entry<T> = { value: T; savedAt: number };
type Options<T> = {
  maxAge?: number;
  storage?: CacheStorage;
  validate?: (value: unknown) => value is T;
};

// peek includes usable stale data; get revalidates it without hiding the UI.
export function createReadCache<T>(ttl = 60000, capacity = 20, options: Options<T> = {}) {
  const maxAge = Math.max(ttl, options.maxAge ?? ttl);
  const values = new Map<string, Entry<T>>();
  const pending = new Map<string, Promise<T>>();
  let generation = 0;
  let hydrated = false;
  function usable(entry: Entry<T>) {
    const age = Date.now() - entry.savedAt;
    return age >= 0 && age < maxAge;
  }
  function hydrate() {
    if (hydrated) return;
    hydrated = true;
    try {
      const raw = options.storage?.read();
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.entries)) return;
      for (const item of data.entries.slice(-capacity)) {
        if (!Array.isArray(item) || item.length !== 2) continue;
        const [key, entry] = item;
        if (typeof key === "string" && entry && Number.isFinite(entry.savedAt)
          && options.validate?.(entry.value) && usable(entry)) values.set(key, entry);
      }
    } catch { /* Storage can be denied, full, or contain an older format. */ }
  }
  function persist() {
    try {
      const entries = [...values].filter(([, entry]) => usable(entry));
      options.storage?.write(JSON.stringify({ version: 1, entries }));
    } catch { /* Cache writes must never turn a successful API read into an error. */ }
  }
  function entryFor(key: string) {
    hydrate();
    const entry = values.get(key);
    if (entry && !usable(entry)) { values.delete(key); return undefined; }
    return entry;
  }
  function peek(key: string): T | undefined { return entryFor(key)?.value; }
  function get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = entryFor(key);
    if (entry && Date.now() - entry.savedAt < ttl) return Promise.resolve(entry.value);
    const existing = pending.get(key);
    if (existing) return existing;
    const started = generation;
    const request = Promise.resolve().then(load).then(value => {
      if (options.validate && !options.validate(value)) throw new Error("API 返回的数据格式不正确。");
      if (generation === started && pending.get(key) === request) {
        // Unchanged first pages must retain their identity to preserve pagination.
        const previous = values.get(key)?.value;
        if (previous !== undefined && JSON.stringify(previous) === JSON.stringify(value)) value = previous;
        values.delete(key);
        values.set(key, { value, savedAt: Date.now() });
        while (values.size > capacity) values.delete(values.keys().next().value!);
        persist();
      }
      return value;
    }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
    pending.set(key, request);
    return request;
  }
  return {
    peek, get,
    invalidate(match: (key: string) => boolean) {
      hydrate();
      for (const key of values.keys()) if (match(key)) values.delete(key);
      for (const key of pending.keys()) if (match(key)) pending.delete(key);
      persist();
    },
    clear() {
      generation++; hydrated = true; values.clear(); pending.clear();
      try { options.storage?.remove(); } catch { /* Memory invalidation still works. */ }
    },
  };
}
