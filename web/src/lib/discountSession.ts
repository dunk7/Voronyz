import {
  isValidDiscountCode,
  normalizeDiscountCode,
} from "@/lib/discountPricing";

/** sessionStorage key for the active shopper discount (tab session). */
export const DISCOUNT_SESSION_KEY = "voronyzDiscountSession";

export const DISCOUNT_TIMER_MS = 10 * 60 * 1000;

export type DiscountSessionSource = "link" | "manual";

export type DiscountSession = {
  code: string;
  source: DiscountSessionSource;
  endsAt: number;
};

type Listener = () => void;

let booted = false;
let session: DiscountSession | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore listener errors */
    }
  });
}

function isReloadNavigation(): boolean {
  if (typeof performance === "undefined") return false;
  try {
    const entry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;
    if (entry?.type === "reload") return true;
    // Legacy fallback
    const legacy = (
      performance as Performance & { navigation?: { type?: number } }
    ).navigation;
    return legacy?.type === 1;
  } catch {
    return false;
  }
}

function readStoredSession(): DiscountSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DISCOUNT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DiscountSession>;
    const code = normalizeDiscountCode(parsed.code);
    if (!code || !isValidDiscountCode(code)) return null;
    const source: DiscountSessionSource =
      parsed.source === "manual" ? "manual" : "link";
    const endsAt =
      typeof parsed.endsAt === "number" && Number.isFinite(parsed.endsAt)
        ? parsed.endsAt
        : Date.now() + DISCOUNT_TIMER_MS;
    return { code, source, endsAt };
  } catch {
    return null;
  }
}

function writeStoredSession(next: DiscountSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!next) {
      sessionStorage.removeItem(DISCOUNT_SESSION_KEY);
      // Legacy urgency keys from earlier short-link-only timer.
      sessionStorage.removeItem("discountUrgencyFromShortLink");
      sessionStorage.removeItem("discountUrgencyEndsAt");
      sessionStorage.removeItem("discountUrgencyCode");
      return;
    }
    sessionStorage.setItem(DISCOUNT_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* sessionStorage unavailable */
  }
}

/**
 * Strip any discountCode left in localStorage cart from older builds.
 * Discount is session-only and must not survive across visits/reloads via cart JSON.
 */
export function stripPersistedCartDiscountCode(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) || !parsed || typeof parsed !== "object") return;
    const cart = parsed as { discountCode?: unknown };
    if (cart.discountCode == null || cart.discountCode === "") return;
    const next = { ...(parsed as Record<string, unknown>), discountCode: null };
    localStorage.setItem("cart", JSON.stringify(next));
  } catch {
    /* ignore corrupt cart */
  }
}

/**
 * Boot once per page load. Hard reload clears the discount entirely.
 * Soft navigations and first paint after a discount link hydrate from sessionStorage.
 */
export function bootDiscountSession(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;

  stripPersistedCartDiscountCode();

  if (isReloadNavigation()) {
    session = null;
    writeStoredSession(null);
    return;
  }

  session = readStoredSession();
}

function ensureBooted(): void {
  bootDiscountSession();
}

export function getDiscountSession(): DiscountSession | null {
  ensureBooted();
  return session;
}

export function getActiveDiscountCode(): string | null {
  return getDiscountSession()?.code ?? null;
}

export function subscribeDiscountSession(listener: Listener): () => void {
  ensureBooted();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Activate (or refresh) a discount for this browsing session.
 * Survives SPA navigations; cleared on hard reload / tab close.
 */
export function activateDiscountSession(
  code: string | null | undefined,
  source: DiscountSessionSource
): string | null {
  ensureBooted();
  const normalized = normalizeDiscountCode(code);
  if (!normalized || !isValidDiscountCode(normalized)) return null;

  const now = Date.now();
  const keepTimer =
    session?.code === normalized &&
    typeof session.endsAt === "number" &&
    session.endsAt > now;

  session = {
    code: normalized,
    source,
    endsAt: keepTimer ? session!.endsAt : now + DISCOUNT_TIMER_MS,
  };
  writeStoredSession(session);
  stripPersistedCartDiscountCode();
  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
  return normalized;
}

/** Restart the cosmetic countdown without clearing the code. */
export function refreshDiscountSessionTimer(): number | null {
  ensureBooted();
  if (!session) return null;
  session = {
    ...session,
    endsAt: Date.now() + DISCOUNT_TIMER_MS,
  };
  writeStoredSession(session);
  notify();
  return session.endsAt;
}

export function clearDiscountSession(): void {
  ensureBooted();
  if (!session) {
    writeStoredSession(null);
    stripPersistedCartDiscountCode();
    return;
  }
  session = null;
  writeStoredSession(null);
  stripPersistedCartDiscountCode();
  notify();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"));
  }
}
