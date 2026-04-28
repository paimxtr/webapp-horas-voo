import { FlightLogStatus, LimitPeriod, type HourLimit, type UserHourLimit } from "@prisma/client";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

type FlightLogWindow = {
  date: Date;
  durationMinutes: number;
  status: FlightLogStatus;
};

export type LimitStatus = {
  id: string;
  period: LimitPeriod;
  maxMinutes: number;
  consumedMinutes: number;
  percentage: number;
  level: "green" | "yellow" | "red" | "exceeded";
  // Phase 4.2: indicates if this limit uses a per-user override
  isOverridden?: boolean;
};

export function getPeriodRange(period: LimitPeriod, referenceDate = new Date()) {
  switch (period) {
    case LimitPeriod.DAILY:
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
    case LimitPeriod.WEEKLY:
      return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
    case LimitPeriod.MONTHLY:
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case LimitPeriod.YEARLY:
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
  }
}

export function getAlertLevel(percentage: number): LimitStatus["level"] {
  if (percentage > 100) return "exceeded";
  if (percentage >= 95) return "red";
  if (percentage >= 80) return "yellow";
  return "green";
}

/**
 * Build limit statuses for a user, applying per-user overrides if available.
 * Phase 4.2: userOverrides allows per-user maxMinutes to override global limits.
 */
export function buildLimitStatuses(
  limits: HourLimit[],
  logs: FlightLogWindow[],
  referenceDate = new Date(),
  userOverrides: Pick<UserHourLimit, "period" | "maxMinutes">[] = [],
) {
  const approvedLogs = logs.filter((log) => log.status === FlightLogStatus.APPROVED);

  return limits.map((limit) => {
    const override = userOverrides.find((o) => o.period === limit.period);
    const effectiveMax = override ? override.maxMinutes : limit.maxMinutes;
    const isOverridden = !!override;

    const range = getPeriodRange(limit.period, referenceDate);
    const consumedMinutes = approvedLogs
      .filter((log) => log.date >= range.start && log.date <= range.end)
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    const percentage = effectiveMax === 0 ? 0 : (consumedMinutes / effectiveMax) * 100;

    return {
      id: limit.id,
      period: limit.period,
      maxMinutes: effectiveMax,
      consumedMinutes,
      percentage,
      level: getAlertLevel(percentage),
      isOverridden,
    };
  });
}

export function summarizeAlertCounts(limitStatuses: LimitStatus[]) {
  return limitStatuses.reduce(
    (accumulator, status) => {
      if (status.level === "yellow") accumulator.warning += 1;
      if (status.level === "red" || status.level === "exceeded") accumulator.critical += 1;
      return accumulator;
    },
    { warning: 0, critical: 0 },
  );
}
