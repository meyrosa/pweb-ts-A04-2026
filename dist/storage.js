import { PRIORITY_RANK } from "./types.js";
import { uid } from "./utils.js";
export const KEYS = {
    auth: "auth",
    types: "queueTypes",
    tickets: "tickets",
    counters: "counters",
};
export function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }
    catch {
        return fallback;
    }
}
export function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
const DEFAULT_TYPES = [
    { id: "t-a", code: "A", name: "UMUM-1", active: true },
    { id: "t-b", code: "B", name: "UMUM-2", active: true },
    { id: "t-c", code: "C", name: "UMUM-3", active: true },
    { id: "t-g", code: "G", name: "GIGI", active: true },
    { id: "t-f", code: "F", name: "FARMASI", active: true },
    { id: "t-p", code: "P", name: "PSIKOLOG", active: true },
];
export function getTypes() {
    const t = load(KEYS.types, null);
    if (t === null) {
        save(KEYS.types, DEFAULT_TYPES);
        return [...DEFAULT_TYPES];
    }
    return t;
}
export const saveTypes = (t) => save(KEYS.types, t);
export const getTickets = () => load(KEYS.tickets, []);
export const saveTickets = (t) => save(KEYS.tickets, t);
/** String ringkas untuk mendeteksi perubahan data (dipakai agar render tidak kedip). */
export function snapshot() {
    return ((localStorage.getItem(KEYS.types) ?? "") +
        "|" +
        (localStorage.getItem(KEYS.tickets) ?? ""));
}
export function formatLabel(code, n) {
    return `${code}-${String(n).padStart(3, "0")}`;
}
function compareTickets(a, b) {
    const r = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (r !== 0)
        return r;
    return a.createdAt - b.createdAt || a.number - b.number;
}
export function getWaiting(typeId) {
    return getTickets()
        .filter((t) => t.typeId === typeId && t.status === "waiting")
        .sort(compareTickets);
}
export const countWaiting = (typeId) => getWaiting(typeId).length;
export function getCalled(typeId) {
    return getTickets().find((t) => t.typeId === typeId && t.status === "called");
}
export function issueTicket(typeId, priority) {
    const type = getTypes().find((t) => t.id === typeId);
    if (!type)
        throw new Error("Jenis antrian tidak ditemukan.");
    if (!type.active)
        throw new Error("Jenis antrian sedang nonaktif.");
    const counters = load(KEYS.counters, {});
    const number = (counters[type.code] ?? 0) + 1;
    counters[type.code] = number;
    save(KEYS.counters, counters);
    const ticket = {
        id: uid(),
        typeId: type.id,
        code: type.code,
        number,
        label: formatLabel(type.code, number),
        priority,
        status: "waiting",
        createdAt: Date.now(),
    };
    const tickets = getTickets();
    tickets.push(ticket);
    saveTickets(tickets);
    return ticket;
}
/** Tiket yang sedang dipanggil jadi Selesai, lalu panggil tiket berikutnya. */
export function callNext(typeId) {
    const tickets = getTickets();
    const next = tickets
        .filter((t) => t.typeId === typeId && t.status === "waiting")
        .sort(compareTickets)[0];
    if (!next)
        return;
    tickets.forEach((t) => {
        if (t.typeId === typeId && t.status === "called")
            t.status = "done";
    });
    next.status = "called";
    next.calledAt = Date.now();
    saveTickets(tickets);
}
/** Tutup tiket yang sedang dipanggil (Selesai) atau tandai Dilewati. */
export function closeCurrent(typeId, status) {
    const tickets = getTickets();
    tickets.forEach((t) => {
        if (t.typeId === typeId && t.status === "called")
            t.status = status;
    });
    saveTickets(tickets);
}
export function resetQueue() {
    saveTickets([]);
    save(KEYS.counters, {});
}
export function deleteType(typeId) {
    saveTypes(getTypes().filter((t) => t.id !== typeId));
    saveTickets(getTickets().filter((t) => t.typeId !== typeId));
}
