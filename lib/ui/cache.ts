// Remember the last data each main screen showed, for this browser tab only,
// so switching tabs shows it instantly while fresh data loads quietly.
// Cleared on sign-out (useAuthGuard). Never persisted.
const store = new Map<string, unknown>()

export const getCached = <T,>(key: string): T | undefined => store.get(key) as T | undefined
export const setCached = <T,>(key: string, value: T): T => { store.set(key, value); return value }
export const clearCache = () => store.clear()
export const dropCached = (key: string) => { store.delete(key) }
