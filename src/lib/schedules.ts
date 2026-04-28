import { DutyScheduleStatus } from "@prisma/client";
import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import type { LimitStatus } from "@/lib/hours";

export const dutyScheduleStatusLabels: Record<DutyScheduleStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  CHANGED: "Alterada",
  CANCELLED: "Cancelada",
};

export function getDutyScheduleStatusVariant(status: DutyScheduleStatus) {
  switch (status) {
    case DutyScheduleStatus.PUBLISHED:
      return "success";
    case DutyScheduleStatus.CHANGED:
      return "warning";
    case DutyScheduleStatus.CANCELLED:
      return "danger";
    default:
      return "muted";
  }
}

export function getWorstLimitLevel(limitStatuses: LimitStatus[]): "green" | "yellow" | "red" {
  if (limitStatuses.some((status) => status.level === "red" || status.level === "exceeded")) {
    return "red";
  }

  if (limitStatuses.some((status) => status.level === "yellow")) {
    return "yellow";
  }

  return "green";
}

export function getLimitLevelVariant(level: "green" | "yellow" | "red") {
  if (level === "green") return "success";
  if (level === "yellow") return "warning";
  return "danger";
}

export function getLimitLevelLabel(level: "green" | "yellow" | "red") {
  if (level === "green") return "Dentro do limite";
  if (level === "yellow") return "PrÃ³ximo do limite";
  return "Em limite crÃ­tico";
}

export function overlapsInterval(startAt: Date, endAt: Date, otherStartAt: Date, otherEndAt: Date) {
  return startAt < otherEndAt && endAt > otherStartAt;
}

export function buildCalendarDays(referenceDate: Date, view: "month" | "week") {
  if (view === "week") {
    return eachDayOfInterval({
      start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
      end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
    });
  }

  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(referenceDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(referenceDate), { weekStartsOn: 1 }),
  });
}

export function formatDateTimeLocalInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}