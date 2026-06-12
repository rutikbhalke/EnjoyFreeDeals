export type MobileUserSession = {
  userId?: string;
  mobile: string;
  full_name: string;
  is_test_user: boolean;
  token?: string;
};

const SESSION_KEY = "enjoyfreedeals.mobileSession";

export function saveUserSession(user: MobileUserSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("enjoyfreedeals-session-change"));
}

export function getUserSession(): MobileUserSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MobileUserSession;
    return parsed?.mobile ? parsed : null;
  } catch {
    clearUserSession();
    return null;
  }
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("enjoyfreedeals-session-change"));
}

export function getUserId(): string {
  const session = getUserSession();
  return session?.mobile || session?.userId || "9699353648";
}

export function isLoggedIn() {
  return getUserSession() !== null;
}
