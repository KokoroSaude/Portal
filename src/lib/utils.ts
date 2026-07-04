import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function maskPhone(phone: string, phoneLast4?: string | null) {
  if (phoneLast4 && /^\d{3,4}$/.test(phoneLast4)) {
    return `•••• ${phoneLast4}`;
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 8 && !phone.startsWith("KE1.")) {
    return `•••• ${digits.slice(-4)}`;
  }
  if (phone.startsWith("KE1.")) {
    return "•••• ••••";
  }
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 4)} •••• ${phone.slice(-4)}`;
}
