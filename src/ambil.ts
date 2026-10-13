import { getTypes, issueTicket, countWaiting } from "./storage.js";
import { PRIORITIES } from "./types.js";
import type { Priority } from "./types.js";
import { $, escapeHtml as esc, formatTime } from "./utils.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
if (session) {
  $("userInfo").textContent = `${session.firstName} · ${session.role}`;
  $("logoutBtn").addEventListener("click", logout);
}

const grid = $("takeGrid");
const result = $("result");
const updated = $("updated");
let lastSig = "";
const selected = new Map<string, Priority>();

function render(): void {
  const active = getTypes().filter((t) => t.active);
  updated.textContent = `Jenis antrian baru muncul otomatis. Data ${formatTime()}`;
  const sig = JSON.stringify(active);
  if (sig === lastSig) return;
  lastSig = sig;
  selected.clear();

  grid.innerHTML = active.length
    ? active.map((t) => `
      <section class="card">
        <div class="row between"><h3>${esc(t.name)}</h3><span class="badge">${esc(t.code)}</span></div>
        <button class="btn primary block" data-type="${t.id}">Ambil Nomor</button>
        <details>
          <summary class="muted small">Ambil dengan prioritas</summary>
          <div class="row">
            ${PRIORITIES.filter((p) => p !== "Normal").map((p) =>
              `<button class="btn small" data-select="${t.id}" data-priority="${p}">${p}</button>`).join("")}
          </div>
        </details>
      </section>`).join("")
    : `<p class="muted">Belum ada jenis antrian aktif.</p>`;
}

grid.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const sel = target.closest<HTMLButtonElement>("button[data-select]");
  if (sel) {
    const id = sel.dataset.select!;
    const p = sel.dataset.priority as Priority;
    if (selected.get(id) === p) selected.delete(id);
    else selected.set(id, p);
    grid.querySelectorAll<HTMLButtonElement>(`button[data-select="${id}"]`).forEach((b) => {
      b.classList.toggle("dark", selected.get(id) === b.dataset.priority);
    });
    return;
  }

  const btn = target.closest<HTMLButtonElement>("button[data-type]");
  if (!btn) return;
  const id = btn.dataset.type!;
  const priority = selected.get(id) ?? "Normal";
  try {
    const type = getTypes().find((t) => t.id === id);
    const ticket = issueTicket(id, priority);
    result.hidden = false;
    result.innerHTML = `
      <div class="muted small">Nomor antrian Anda (${esc(type?.name ?? "")})</div>
      <div class="huge accent">${ticket.label}</div>
      <div class="muted small">Prioritas ${ticket.priority} · ${countWaiting(ticket.typeId)} tiket menunggu</div>`;
  } catch (err) {
    result.hidden = false;
    result.textContent = (err as Error).message;
  }
  selected.delete(id);
  grid.querySelectorAll<HTMLButtonElement>(`button[data-select="${id}"]`).forEach((b) => b.classList.remove("dark"));
});

render();
setInterval(render, 2000);
window.addEventListener("storage", render);