const SESSION_KEY = "lsy-driver-session";

export function getDriverSessionId(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) return null;
    const id = Number(raw);
    return Number.isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

export function setDriverSessionId(id: number): void {
  localStorage.setItem(SESSION_KEY, String(id));
}

export function clearDriverSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
