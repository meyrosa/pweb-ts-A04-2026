import { requireAdmin, logout } from "./auth.js";
import { STATUS_TEXT } from "./types.js";
import { getTypes, saveTypes, getTickets, issueTicket, countWaiting, resetQueue, deleteType, snapshot, } from "./storage.js";
import { $, escapeHtml as esc, uid } from "./utils.js";
const session = requireAdmin();
if (session)
    init(session);
function init(s) {
    $("userInfo").textContent = `${s.firstName} · ${s.role}`;
    $("logoutBtn").addEventListener("click", logout);
    const typeForm = $("typeForm");
    const codeInput = $("typeCode");
    const nameInput = $("typeName");
    const typeError = $("typeError");
    const typeList = $("typeList");
    const ticketForm = $("ticketForm");
    const ticketType = $("ticketType");
    const ticketPriority = $("ticketPriority");
    const ticketMsg = $("ticketMsg");
    const ticketList = $("ticketList");
    let lastSig = "";
    function showTypeError(msg) {
        typeError.textContent = msg;
        typeError.hidden = false;
    }
    typeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = codeInput.value.trim().toUpperCase();
        const name = nameInput.value.trim();
        if (!/^[A-Z]$/.test(code))
            return showTypeError("Kode harus 1 huruf kapital (A-Z).");
        if (!name)
            return showTypeError("Nama layanan wajib diisi.");
        const types = getTypes();
        if (types.some((t) => t.code.toLowerCase() === code.toLowerCase()))
            return showTypeError(`Kode "${code}" sudah dipakai.`);
        if (types.some((t) => t.name.toLowerCase() === name.toLowerCase()))
            return showTypeError(`Nama "${name}" sudah dipakai.`);
        types.push({ id: uid(), code, name, active: true });
        saveTypes(types);
        typeError.hidden = true;
        typeForm.reset();
        render();
    });
    typeList.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn)
            return;
        const id = btn.dataset.id;
        if (btn.dataset.act === "toggle") {
            const types = getTypes();
            const t = types.find((x) => x.id === id);
            if (t)
                t.active = !t.active;
            saveTypes(types);
        }
        else if (btn.dataset.act === "delete") {
            if (!confirm("Hapus jenis antrian ini beserta seluruh tiketnya?"))
                return;
            deleteType(id);
        }
        render();
    });
    $("resetBtn").addEventListener("click", () => {
        if (!confirm("Reset semua antrian dan nomor tiket kembali ke awal?"))
            return;
        resetQueue();
        ticketMsg.textContent = "Antrian berhasil di-reset.";
        render();
    });
    ticketForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!ticketType.value) {
            ticketMsg.textContent = "Pilih jenis antrian terlebih dahulu.";
            return;
        }
        try {
            const t = issueTicket(ticketType.value, ticketPriority.value);
            ticketMsg.textContent = `Tiket ${t.label} (${t.priority}) berhasil diterbitkan.`;
        }
        catch (err) {
            ticketMsg.textContent = err.message;
        }
        render();
    });
    function render() {
        const sig = snapshot();
        if (sig === lastSig)
            return;
        lastSig = sig;
        const types = getTypes();
        const tickets = getTickets();
        typeList.innerHTML = types.length
            ? types.map((t) => `
        <div class="item">
          <div>
            <strong>${esc(t.name)}</strong> <span class="muted">(${esc(t.code)})</span>
            <div class="muted small">${countWaiting(t.id)} menunggu${t.active ? "" : " · nonaktif"}</div>
          </div>
          <div class="row">
            <button class="btn small" data-act="toggle" data-id="${t.id}">${t.active ? "Nonaktifkan" : "Aktifkan"}</button>
            <button class="btn small danger-o" data-act="delete" data-id="${t.id}">Hapus</button>
          </div>
        </div>`).join("")
            : `<p class="muted">Belum ada jenis antrian.</p>`;
        const prev = ticketType.value;
        const active = types.filter((t) => t.active);
        ticketType.innerHTML =
            `<option value="">Pilih jenis antrian</option>` +
                active.map((t) => `<option value="${t.id}">${esc(t.name)} (${esc(t.code)})</option>`).join("");
        if (active.some((t) => t.id === prev))
            ticketType.value = prev;
        ticketList.innerHTML = types.map((t) => {
            const list = tickets.filter((x) => x.typeId === t.id).sort((a, b) => b.number - a.number);
            if (!list.length)
                return "";
            return `<div class="group-title">${esc(t.name)}</div>` + list.map((x) => `
        <div class="ticket-row">
          <strong>${x.label}</strong>
          <span class="badge">${x.priority}</span>
          <span class="badge st-${x.status}">${STATUS_TEXT[x.status]}</span>
        </div>`).join("");
        }).join("") || `<p class="muted">Belum ada tiket.</p>`;
    }
    render();
    setInterval(render, 2000);
    window.addEventListener("storage", render);
}
