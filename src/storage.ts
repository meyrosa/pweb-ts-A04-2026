import type { Priority, QueueType, Ticket } from "./types.js";
import { PRIORITY_RANK } from "./types.js";
import { uid } from "./utils.js";

export const KEYS = {
  auth: "auth",
  types: "queueTypes",
  tickets: "tickets",
  counters: "counters",
} as const;

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_TYPES: QueueType[] = [
  { id: "t-a", code: "A", name: "UMUM-1", active: true },
  { id: "t-b", code: "B", name: "UMUM-2", active: true },
  { id: "t-c", code: "C", name: "UMUM-3", active: true },
  { id: "t-g", code: "G", name: "GIGI", active: true },
  { id: "t-f", code: "F", name: "FARMASI", active: true },
  { id: "t-p", code: "P", name: "PSIKOLOG", active: true },
];

export function getTypes(): QueueType[] {
  const t = load<QueueType[] | null>(KEYS.types, null);
  if (t === null) {
    save(KEYS.types, DEFAULT_TYPES);
    return [...DEFAULT_TYPES];
  }
  return t;
}
export const saveTypes = (t: QueueType[]) => save(KEYS.types, t);
export const getTickets = (): Ticket[] => load<Ticket[]>(KEYS.tickets, []);
export const saveTickets = (t: Ticket[]) => save(KEYS.tickets, t);

/** String ringkas untuk mendeteksi perubahan data (dipakai agar render tidak kedip). */
export function snapshot(): string {
  return (
    (localStorage.getItem(KEYS.types) ?? "") +
    "|" +
    (localStorage.getItem(KEYS.tickets) ?? "")
  );
}

export function formatLabel(code: string, n: number): string {
  return `${code}-${String(n).padStart(3, "0")}`;
}

function compareTickets(a: Ticket, b: Ticket): number {
  const r = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (r !== 0) return r;
  return a.createdAt - b.createdAt || a.number - b.number;
}

export function getWaiting(typeId: string): Ticket[] {
  return getTickets()
    .filter((t) => t.typeId === typeId && t.status === "waiting")
    .sort(compareTickets);
}

export const countWaiting = (typeId: string): number => getWaiting(typeId).length;

export function getCalled(typeId: string): Ticket | undefined {
  return getTickets().find((t) => t.typeId === typeId && t.status === "called");
}

export function issueTicket(typeId: string, priority: Priority): Ticket {
  const type = getTypes().find((t) => t.id === typeId);
  if (!type) throw new Error("Jenis antrian tidak ditemukan.");
  if (!type.active) throw new Error("Jenis antrian sedang nonaktif.");

  const counters = load<Record<string, number>>(KEYS.counters, {});
  const number = (counters[type.code] ?? 0) + 1;
  counters[type.code] = number;
  save(KEYS.counters, counters);

  const ticket: Ticket = {
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
export function callNext(typeId: string): void {
  const tickets = getTickets();
  const next = tickets
    .filter((t) => t.typeId === typeId && t.status === "waiting")
    .sort(compareTickets)[0];
  if (!next) return;
  tickets.forEach((t) => {
    if (t.typeId === typeId && t.status === "called") t.status = "done";
  });
  next.status = "called";
  next.calledAt = Date.now();
  saveTickets(tickets);
}

/** Tutup tiket yang sedang dipanggil (Selesai) atau tandai Dilewati. */
export function closeCurrent(typeId: string, status: "done" | "skipped"): void {
  const tickets = getTickets();
  tickets.forEach((t) => {
    if (t.typeId === typeId && t.status === "called") t.status = status;
  });
  saveTickets(tickets);
}

export function resetQueue(): void {
  saveTickets([]);
  save(KEYS.counters, {});
}

export function deleteType(typeId: string): void {
  saveTypes(getTypes().filter((t) => t.id !== typeId));
  saveTickets(getTickets().filter((t) => t.typeId !== typeId));
}