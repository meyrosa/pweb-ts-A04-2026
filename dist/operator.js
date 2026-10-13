import { requireAdmin, logout } from "./auth.js";
import { getTypes, getCalled, getWaiting, callNext, closeCurrent, snapshot, } from "./storage.js";
import { $, escapeHtml as esc } from "./utils.js";
const session = requireAdmin();
if (session)
    init(session);
function init(s) {
    $("userInfo").textContent = `${s.firstName} · ${s.role}`;
    $("logoutBtn").addEventListener("click", logout);
    const grid = $("operatorGrid");
    let lastSig = "";
    grid.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn || btn.disabled)
            return;
        const id = btn.dataset.id;
        if (btn.dataset.action === "next")
            callNext(id);
        else if (btn.dataset.action === "skip")
            closeCurrent(id, "skipped");
        else if (btn.dataset.action === "done")
            closeCurrent(id, "done");
        render();
    });
    function render() {
        const sig = snapshot();
        if (sig === lastSig)
            return;
        lastSig = sig;
        const types = getTypes();
        grid.innerHTML = types.length
            ? types.map((t) => {
                const called = getCalled(t.id);
                const waiting = getWaiting(t.id);
                const next = waiting[0];
                return `
          <section class="card">
            <div class="row between">
              <h3>${esc(t.name)} ${t.active ? "" : '<span class="badge">Nonaktif</span>'}</h3>
              <span class="muted small">${waiting.length} menunggu</span>
            </div>
            <div class="two-col">
              <div><div class="label">SEDANG DIPANGGIL</div><div class="big accent">${called ? called.label : "-"}</div></div>
              <div><div class="label">BERIKUTNYA</div><div class="big">${next ? next.label : "-"}</div>
                ${next ? `<div class="muted small">Prioritas ${next.priority}</div>` : ""}</div>
            </div>
            <div class="row">
              <button class="btn primary grow" data-action="next" data-id="${t.id}" ${next ? "" : "disabled"}>Panggil Berikutnya</button>
              <button class="btn" data-action="skip" data-id="${t.id}" ${called ? "" : "disabled"}>Lewati</button>
              <button class="btn" data-action="done" data-id="${t.id}" ${called ? "" : "disabled"}>Selesai</button>
            </div>
            ${next ? "" : '<p class="muted small">Tidak ada tiket menunggu untuk jenis antrian ini.</p>'}
          </section>`;
            }).join("")
            : `<p class="muted">Belum ada jenis antrian. Tambahkan lewat Dashboard Admin.</p>`;
    }
    render();
    setInterval(render, 2000);
    window.addEventListener("storage", render);
}
