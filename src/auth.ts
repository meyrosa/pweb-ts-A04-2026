import type { AuthSession, Role } from "./types.js";
import { KEYS, load, save } from "./storage.js";

export function getSession(): AuthSession | null {
  const s = load<AuthSession | null>(KEYS.auth, null);
  return s && s.token && s.role && s.firstName ? s : null;
}

export const setSession = (s: AuthSession) => save(KEYS.auth, s);
export const isAdminRole = (r: Role) => r === "admin" || r === "moderator";

export function redirectByRole(role: Role): void {
  location.replace(isAdminRole(role) ? "index.html" : "ambil-antrian.html");
}

function reveal(): void {
  document.body.classList.remove("guard");
}

/** Untuk halaman operator: cukup sudah login. */
export function requireAuth(): AuthSession | null {
  const s = getSession();
  if (!s) {
    location.replace("login.html");
    return null;
  }
  reveal();
  return s;
}

/** Untuk dashboard admin: wajib login dan role admin/moderator. */
export function requireAdmin(): AuthSession | null {
  const s = getSession();
  if (!s || !isAdminRole(s.role)) {
    location.replace("login.html");
    return null;
  }
  reveal();
  return s;
}

export function logout(): void {
  localStorage.removeItem(KEYS.auth);
  location.href = "login.html";
}