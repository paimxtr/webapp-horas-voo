import { FlightLogStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildLimitStatuses, summarizeAlertCounts } from "@/lib/hours";
import { getWorstLimitLevel } from "@/lib/schedules";

type CrewReference = {
  id: string;
  name: string;
  rank: string | null;
};

type FlightLogWithCrewReferences = {
  id: string;
  aircraftId: string;
  date: Date;
  otherCrewMembers: CrewReference[];
};

type CrewCrossCheck = {
  hasDiscrepancy: boolean;
  missingCrewMembers: CrewReference[];
  matchingCrewMembers: CrewReference[];
};

function buildFlightKey(aircraftId: string, date: Date, crewMemberId: string) {
  return `${crewMemberId}:${aircraftId}:${date.toISOString().slice(0, 10)}`;
}

async function attachCrewCrossCheck<T extends FlightLogWithCrewReferences>(
  logs: T[],
): Promise<Array<T & { crewCrossCheck: CrewCrossCheck }>> {
  if (logs.length === 0) {
    return [];
  }

  const referencedCrewIds = [...new Set(logs.flatMap((log) => log.otherCrewMembers.map((crewMember) => crewMember.id)))];

  if (referencedCrewIds.length === 0) {
    return logs.map((log) => ({
      ...log,
      crewCrossCheck: {
        hasDiscrepancy: false,
        missingCrewMembers: [],
        matchingCrewMembers: [],
      },
    }));
  }

  const aircraftIds = [...new Set(logs.map((log) => log.aircraftId))];
  const dates = [...new Map(logs.map((log) => [log.date.toISOString().slice(0, 10), log.date])).values()];

  const matchingLogs = await prisma.flightLog.findMany({
    where: {
      aircraftId: { in: aircraftIds },
      date: { in: dates },
      crewMemberId: { in: referencedCrewIds },
      status: { not: FlightLogStatus.DRAFT },
    },
    select: {
      crewMemberId: true,
      aircraftId: true,
      date: true,
    },
  });

  const matchingKeys = new Set(
    matchingLogs.map((log) => buildFlightKey(log.aircraftId, log.date, log.crewMemberId)),
  );

  return logs.map((log) => {
    const matchingCrewMembers = log.otherCrewMembers.filter((crewMember) =>
      matchingKeys.has(buildFlightKey(log.aircraftId, log.date, crewMember.id)),
    );
    const missingCrewMembers = log.otherCrewMembers.filter(
      (crewMember) => !matchingKeys.has(buildFlightKey(log.aircraftId, log.date, crewMember.id)),
    );

    return {
      ...log,
      crewCrossCheck: {
        hasDiscrepancy: missingCrewMembers.length > 0,
        missingCrewMembers,
        matchingCrewMembers,
      },
    };
  });
}

export async function getSharedData() {
  const [limits, aircraft, missionTypes] = await Promise.all([
    prisma.hourLimit.findMany({ orderBy: { period: "asc" } }),
    prisma.aircraft.findMany({ orderBy: { code: "asc" } }),
    prisma.missionType.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { limits, aircraft, missionTypes };
}

export async function getCommanderDashboardData() {
  const [limits, crewMembers, pendingCount, recentLogs, notifications, upcomingSchedules] = await Promise.all([
    prisma.hourLimit.findMany({ orderBy: { period: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.CREW_MEMBER },
      include: {
        flightLogs: {
          orderBy: { date: "desc" },
          select: { date: true, durationMinutes: true, status: true },
        },
        hourLimitOverrides: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.flightLog.count({ where: { status: FlightLogStatus.SUBMITTED } }),
    prisma.flightLog.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        crewMember: true,
        aircraft: true,
        missionType: true,
        otherCrewMembers: {
          select: { id: true, name: true, rank: true },
        },
      },
    }),
    prisma.notification.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.dutySchedule.findMany({
      where: {
        startAt: { gte: new Date() },
        status: { not: 'CANCELLED' as const },
      },
      include: {
        assignments: { select: { userId: true } },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
  ]);

  const crewHours = crewMembers.map((member) => {
    const approvedMinutes = member.flightLogs
      .filter((log) => log.status === FlightLogStatus.APPROVED)
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    const limitStatuses = buildLimitStatuses(limits, member.flightLogs, new Date(), member.hourLimitOverrides);
    const counts = summarizeAlertCounts(limitStatuses);

    return {
      id: member.id,
      name: member.name,
      approvedMinutes,
      limitStatuses,
      hasWarning: counts.warning > 0,
      hasCritical: counts.critical > 0,
    };
  });

  const totalApprovedMinutes = crewHours.reduce((sum, item) => sum + item.approvedMinutes, 0);
  const crewAtWarning = crewHours.filter((item) => item.hasWarning).length;
  const crewAtCritical = crewHours.filter((item) => item.hasCritical).length;

  const recentLogsWithCrossCheck = await attachCrewCrossCheck(recentLogs);

  return {
    totalApprovedMinutes,
    pendingCount,
    crewAtWarning,
    crewAtCritical,
    crewHours,
    recentLogs: recentLogsWithCrossCheck,
    notifications,
    upcomingSchedules,
  };
}

export async function getUsersPageData() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function getAircraftPageData() {
  return prisma.aircraft.findMany({
    orderBy: { code: "asc" },
  });
}

export async function getMissionTypesPageData() {
  return prisma.missionType.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getHourLimitsPageData() {
  return prisma.hourLimit.findMany({
    orderBy: { period: "asc" },
  });
}

// Phase 4.2: Limits overview – all crew with effective limits and current consumption
export async function getLimitsOverviewPageData() {
  const [limits, crewMembers] = await Promise.all([
    prisma.hourLimit.findMany({ orderBy: { period: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.CREW_MEMBER },
      include: {
        flightLogs: {
          select: { date: true, durationMinutes: true, status: true },
        },
        hourLimitOverrides: true,
        limitExemptions: {
          where: { active: true, validUntil: { gte: new Date() } },
          orderBy: { validUntil: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    limits,
    crewMembers: crewMembers.map((member) => ({
      id: member.id,
      name: member.name,
      rank: member.rank,
      limitStatuses: buildLimitStatuses(limits, member.flightLogs, new Date(), member.hourLimitOverrides),
      overrides: member.hourLimitOverrides,
      exemptions: member.limitExemptions,
    })),
  };
}

// Phase 4.2: Get user limit overrides and exemptions for the limits page
export async function getUserLimitOverridesData() {
  const [crewMembers, overrides, exemptions] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CREW_MEMBER, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.userHourLimit.findMany({
      include: { user: true },
      orderBy: [{ user: { name: "asc" } }, { period: "asc" }],
    }),
    prisma.limitExemption.findMany({
      where: { active: true },
      include: { user: true, grantedBy: true },
      orderBy: { validUntil: "asc" },
    }),
  ]);

  return { crewMembers, overrides, exemptions };
}

export async function getApprovalsPageData(filters: { status?: string; crewMemberId?: string }) {
  const [crewMembers, logs] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.CREW_MEMBER, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.flightLog.findMany({
      where: {
        status: filters.status && filters.status !== "ALL" ? (filters.status as FlightLogStatus) : undefined,
        crewMemberId: filters.crewMemberId || undefined,
      },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }, { date: "desc" }],
      include: {
        crewMember: true,
        aircraft: true,
        missionType: true,
        approvedBy: true,
        otherCrewMembers: {
          select: { id: true, name: true, rank: true },
        },
        attachments: true,
      },
    }),
  ]);

  const logsWithCrossCheck = await attachCrewCrossCheck(logs);

  return { crewMembers, logs: logsWithCrossCheck };
}

export async function getCrewDashboardData(userId: string) {
  const [limits, logs, schedules, notifications, userOverrides] = await Promise.all([
    prisma.hourLimit.findMany({ orderBy: { period: "asc" } }),
    prisma.flightLog.findMany({
      where: { crewMemberId: userId },
      include: {
        aircraft: true,
        missionType: true,
        approvedBy: true,
        otherCrewMembers: {
          select: { id: true, name: true, rank: true },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.dutyScheduleAssignment.findMany({
      where: {
        userId,
        schedule: {
          status: {
            not: 'CANCELLED' as const,
          },
          startAt: {
            gte: new Date(),
          },
        },
      },
      include: { schedule: true },
      orderBy: { schedule: { startAt: "asc" } },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.userHourLimit.findMany({ where: { userId } }),
  ]);

  const limitStatuses = buildLimitStatuses(limits, logs, new Date(), userOverrides);
  const approvedMinutes = logs
    .filter((log) => log.status === FlightLogStatus.APPROVED)
    .reduce((sum, log) => sum + log.durationMinutes, 0);
  const pendingCount = logs.filter((log) => log.status === FlightLogStatus.SUBMITTED).length;

  return {
    approvedMinutes,
    pendingCount,
    limitStatuses,
    logs,
    schedules,
    nextSchedule: schedules[0] ?? null,
    notifications,
  };
}

export async function getCrewLogsPageData(userId: string) {
  const [aircraft, missionTypes, crewMembers, logs] = await Promise.all([
    prisma.aircraft.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    prisma.missionType.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: {
        role: Role.CREW_MEMBER,
        active: true,
        id: { not: userId },
      },
      orderBy: { name: "asc" },
    }),
    prisma.flightLog.findMany({
      where: { crewMemberId: userId },
      include: {
        aircraft: true,
        missionType: true,
        approvedBy: true,
        otherCrewMembers: {
          select: { id: true, name: true, rank: true },
        },
        attachments: true,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  return { aircraft, missionTypes, crewMembers, logs };
}

export async function getFlightLogForEdit(userId: string, id: string) {
  const [flightLog, aircraft, missionTypes, crewMembers] = await Promise.all([
    prisma.flightLog.findFirst({
      where: { id, crewMemberId: userId },
      include: {
        aircraft: true,
        missionType: true,
        otherCrewMembers: {
          select: { id: true, name: true, rank: true },
        },
        attachments: true,
      },
    }),
    prisma.aircraft.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    prisma.missionType.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: {
        role: Role.CREW_MEMBER,
        active: true,
        id: { not: userId },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return { flightLog, aircraft, missionTypes, crewMembers };
}

// Phase 4.4: Get audit history for a specific flight log
export async function getFlightLogHistory(flightLogId: string) {
  return prisma.auditLog.findMany({
    where: { entityType: "flightLog", entityId: flightLogId },
    include: { actor: { select: { id: true, name: true, rank: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCommanderSchedulesPageData() {
  const [limits, crewMembers, schedules] = await Promise.all([
    prisma.hourLimit.findMany({ orderBy: { period: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.CREW_MEMBER, active: true },
      include: {
        flightLogs: {
          select: { date: true, durationMinutes: true, status: true },
        },
        hourLimitOverrides: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.dutySchedule.findMany({
      orderBy: { startAt: "desc" },
      include: {
        assignments: {
          include: { user: true },
        },
      },
    }),
  ]);

  const crewMembersWithLimits = crewMembers.map((member) => {
    const limitStatuses = buildLimitStatuses(limits, member.flightLogs, new Date(), member.hourLimitOverrides);
    const limitLevel = getWorstLimitLevel(limitStatuses);
    return {
      id: member.id,
      name: member.name,
      rank: member.rank,
      limitLevel,
      limitStatuses,
    };
  });

  return { crewMembers: crewMembersWithLimits, schedules };
}

export async function getReportsPageData(filters: {
  startDate?: string;
  endDate?: string;
}) {
  const startDate = filters.startDate ? new Date(filters.startDate) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : new Date();

  const [limits, crewMembers, aircraftList, missionTypes, approvedLogs, pendingRejectedLogs, allApprovedLogs] =
    await Promise.all([
      prisma.hourLimit.findMany({ orderBy: { period: "asc" } }),
      prisma.user.findMany({
        where: { role: Role.CREW_MEMBER },
        include: { hourLimitOverrides: true },
        orderBy: { name: "asc" },
      }),
      prisma.aircraft.findMany({ orderBy: { code: "asc" } }),
      prisma.missionType.findMany({ orderBy: { name: "asc" } }),
      prisma.flightLog.findMany({
        where: { date: { gte: startDate, lte: endDate }, status: FlightLogStatus.APPROVED },
        select: {
          id: true,
          crewMemberId: true,
          aircraftId: true,
          missionTypeId: true,
          date: true,
          origin: true,
          destination: true,
          durationMinutes: true,
          crewMember: { select: { id: true, name: true, rank: true } },
          aircraft: { select: { id: true, code: true, model: true } },
          missionType: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.flightLog.findMany({
        where: { status: { in: [FlightLogStatus.SUBMITTED, FlightLogStatus.REJECTED] } },
        select: {
          id: true,
          crewMemberId: true,
          date: true,
          origin: true,
          destination: true,
          durationMinutes: true,
          status: true,
          submittedAt: true,
          rejectionReason: true,
          crewMember: { select: { id: true, name: true } },
          aircraft: { select: { id: true, code: true } },
          missionType: { select: { id: true, name: true } },
        },
        orderBy: [{ status: "asc" }, { date: "desc" }],
      }),
      prisma.flightLog.findMany({
        where: { status: FlightLogStatus.APPROVED },
        select: { crewMemberId: true, date: true, durationMinutes: true, status: true },
      }),
    ]);

  const hoursByCrewMember = crewMembers
    .map((member) => {
      const logs = approvedLogs.filter((l) => l.crewMemberId === member.id);
      return {
        id: member.id,
        name: member.name,
        rank: member.rank,
        totalMinutes: logs.reduce((s, l) => s + l.durationMinutes, 0),
        logCount: logs.length,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const hoursByAircraft = aircraftList
    .map((aircraft) => {
      const logs = approvedLogs.filter((l) => l.aircraftId === aircraft.id);
      return {
        id: aircraft.id,
        code: aircraft.code,
        model: aircraft.model,
        totalMinutes: logs.reduce((s, l) => s + l.durationMinutes, 0),
        logCount: logs.length,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const hoursByMissionType = missionTypes
    .map((mt) => {
      const logs = approvedLogs.filter((l) => l.missionTypeId === mt.id);
      return {
        id: mt.id,
        name: mt.name,
        totalMinutes: logs.reduce((s, l) => s + l.durationMinutes, 0),
        logCount: logs.length,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  const limitStatuses = crewMembers.map((member) => {
    const memberLogs = allApprovedLogs.filter((l) => l.crewMemberId === member.id);
    return {
      id: member.id,
      name: member.name,
      rank: member.rank,
      limitStatuses: buildLimitStatuses(limits, memberLogs, new Date(), member.hourLimitOverrides),
    };
  });

  return {
    startDate,
    endDate,
    hoursByCrewMember,
    hoursByAircraft,
    hoursByMissionType,
    limitStatuses,
    pendingRejectedLogs,
  };
}

export async function getCrewSchedulesPageData(userId: string) {
  return prisma.dutyScheduleAssignment.findMany({
    where: {
      userId,
      schedule: {
        status: {
          not: 'CANCELLED' as const,
        },
      },
    },
    include: {
      schedule: {
        include: {
          assignments: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { schedule: { startAt: "asc" } },
  });
}
