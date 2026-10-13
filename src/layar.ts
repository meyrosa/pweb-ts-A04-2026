import { getTypes, getCalled, countWaiting, snapshot } from "./storage.js";
import { $, escapeHtml as esc, formatTime } from "./utils.js";
import { requireAuth, logout } from "./auth.js";

const session = requireAuth();
if (session) {
  $("userInfo").textContent = `${session.firstName} · ${session.role}`;
  $("logoutBtn").addEventListener("click", logout);
}

const grid = $("screenGrid");
const updated = $("updated");
const soundBtn = $<HTMLButtonElement>("soundBtn");
const fsBtn = $<HTMLButtonElement>("fsBtn");

let soundOn = false;
let initialized = false;
let lastSig = "";
const lastCalled = new Map<string, string>();

function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "id-ID";
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "Suara: Aktif" : "Aktifkan Suara";
  if (soundOn) speak("Suara panggilan antrian aktif");
});

fsBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    /* fullscreen ditolak browser, abaikan */
  }
});
document.addEventListener("fullscreenchange", () => {
  fsBtn.textContent = document.fullscreenElement ? "Keluar Layar Penuh" : "Layar Penuh";
});

function render(): void {
  updated.textContent = `Diperbarui ${formatTime()}`;
  const sig = snapshot();
  if (sig === lastSig) return;
  lastSig = sig;

  const active = getTypes().filter((t) => t.active);
  grid.innerHTML = active.length
    ? active.map((t) => {
        const called = getCalled(t.id);
        return `
        <article class="card screen-card">
          <div class="row between"><h3>${esc(t.name)}</h3><span class="badge">${esc(t.code)}</span></div>
          <div class="screen-body">
            ${called
              ? `<div class="called-tag">● DIPANGGIL</div><div class="huge">${called.label}</div>`
              : `<strong>Belum ada nomor dipanggil</strong>
                 <p class="muted small">Nomor akan muncul setelah operator memanggil tiket.</p>`}
          </div>
          <div class="screen-foot muted small">${countWaiting(t.id)} tiket menunggu</div>
        </article>`;
      }).join("")
    : `<p class="muted">Belum ada jenis antrian aktif.</p>`;

  for (const t of active) {
    const c = getCalled(t.id);
    if (c) {
      if (initialized && soundOn && lastCalled.get(t.id) !== c.id) {
        speak(`Nomor antrian ${c.code} ${c.number}, silakan menuju ${t.name}`);
      }
      lastCalled.set(t.id, c.id);
    } else {
      lastCalled.delete(t.id);
    }
  }
  initialized = true;
}

render();
setInterval(render, 2000);
window.addEventListener("storage", render);