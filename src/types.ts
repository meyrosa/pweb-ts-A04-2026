export type Priority = "Normal" | "Lansia" | "Disabilitas" | "VIP";
export type TicketStatus = "waiting" | "called" | "done" | "skipped";
export type Role = "admin" | "moderator" | "user";

export interface QueueType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Ticket {
  id: string;
  typeId: string;
  code: string;
  number: number;
  label: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: number;
  calledAt?: number;
}

export interface AuthSession {
  token: string;
  role: Role;
  firstName: string;
}

export const PRIORITIES: Priority[] = ["Normal", "Lansia", "Disabilitas", "VIP"];

export const PRIORITY_RANK: Record<Priority, number> = {
  VIP: 0,
  Disabilitas: 1,
  Lansia: 2,
  Normal: 3,
};

export const STATUS_TEXT: Record<TicketStatus, string> = {
  waiting: "Menunggu",
  called: "Dipanggil",
  done: "Selesai",
  skipped: "Dilewati",
};