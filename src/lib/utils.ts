import { clsx, type ClassValue } from "clsx";
import { differenceInMinutes } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { LimitPeriod } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatHours(totalMinutes: number) {
  return (totalMinutes / 60).toFixed(1);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toQueryValue(value: string) {
  return encodeURIComponent(value);
}

export function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function calculateDurationMinutes(departure: Date, arrival: Date) {
  if (arrival <= departure) {
    const nextDay = new Date(arrival);
    nextDay.setDate(nextDay.getDate() + 1);
    return differenceInMinutes(nextDay, departure);
  }

  return differenceInMinutes(arrival, departure);
}

export function periodLabel(period: LimitPeriod): string {
  const labels: Record<string, string> = {
    DAILY: "Diário",
    WEEKLY: "Semanal",
    MONTHLY: "Mensal",
    YEARLY: "Anual",
  };
  return labels[period] ?? period;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}