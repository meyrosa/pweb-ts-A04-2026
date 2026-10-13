import { KEYS, load, save } from "./storage.js";
export function getSession() {
    const s = load(KEYS.auth, null);
    return s && s.token && s.role && s.firstName ? s : null;
}
export const setSession = (s) => save(KEYS.auth, s);
export const isAdminRole = (r) => r === "admin" || r === "moderator";
export function redirectByRole(role) {
    location.replace(isAdminRole(role) ? "index.html" : "ambil-antrian.html");
}
function reveal() {
    document.body.classList.remove("guard");
}
/** Untuk halaman operator: cukup sudah login. */
export function requireAuth() {
    const s = getSession();
    if (!s) {
        location.replace("login.html");
        return null;
    }
    reveal();
    return s;
}
/** Untuk dashboard admin: wajib login dan role admin/moderator. */
export function requireAdmin() {
    const s = getSession();
    if (!s || !isAdminRole(s.role)) {
        location.replace("login.html");
        return null;
    }
    reveal();
    return s;
}
export function logout() {
    localStorage.removeItem(KEYS.auth);
    location.href = "login.html";
}
