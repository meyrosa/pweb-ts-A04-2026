import { $ } from "./utils.js";
import { getSession, setSession, redirectByRole } from "./auth.js";
import type { Role } from "./types.js";

const API = "https://dummyjson.com";

interface LoginResponse {
  accessToken?: string;
  token?: string;
  firstName: string;
  role?: string;
  message?: string;
}

const existing = getSession();
if (existing) redirectByRole(existing.role);

const form = $<HTMLFormElement>("loginForm");
const btn = $<HTMLButtonElement>("loginBtn");
const errorBox = $("loginError");

function showError(msg: string): void {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

async function resolveRole(username: string, fromLogin?: string): Promise<Role> {
  if (fromLogin === "admin" || fromLogin === "moderator" || fromLogin === "user") {
    return fromLogin;
  }
  for (const r of ["admin", "moderator"] as const) {
    const res = await fetch(`${API}/users/filter?key=role&value=${r}&limit=0`);
    if (!res.ok) continue;
    const data = (await res.json()) as { users: { username: string }[] };
    if (data.users.some((u) => u.username === username)) return r;
  }
  return "user";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  const username = $<HTMLInputElement>("username").value.trim();
  const password = $<HTMLInputElement>("password").value;
  if (!username || !password) {
    showError("Username dan password wajib diisi.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Memproses...";
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, expiresInMins: 60 }),
    });
    const data = (await res.json()) as LoginResponse;
    if (!res.ok) {
      showError(data.message || "Username atau password salah.");
      return;
    }
    const token = data.accessToken ?? data.token ?? "";
    const role = await resolveRole(username, data.role);
    setSession({ token, role, firstName: data.firstName });
    redirectByRole(role);
  } catch {
    showError("Koneksi jaringan gagal. Coba lagi.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk";
  }
});