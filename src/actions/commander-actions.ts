"use server";

import bcrypt from "bcryptjs";
import { DutyScheduleStatus, FlightLogStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog, notifyUsers } from "@/lib/audit";
import { requireCommander } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirectWithFeedback } from "@/lib/feedback";
import { overlapsInterval } from "@/lib/schedules";
import { normalizeText, parseBoolean } from "@/lib/utils";
import {
  aircraftSchema,
  dutyScheduleSchema,
  hourLimitSchema,
  limitExemptionSchema,
  missionTypeSchema,
  rejectionSchema,
  userHourLimitSchema,
  userSchema,
} from "@/lib/validation";

export async function saveUserAction(formData: FormData) {
  const commander = await requireCommander();
  const password = normalizeText(formData.get("password"));
  const parsed = userSchema.safeParse({
    id: normalizeText(formData.get("id")) || undefined,
    username: normalizeText(formData.get("username")),
    name: normalizeText(formData.get("name")),
    rank: normalizeText(formData.get("rank")),
    password,
    role: normalizeText(formData.get("role")),
    active: parseBoolean(formData.get("active")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/utilizadores", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const data = parsed.data;

  if (!data.id && password.length < 6) {
    redirectWithFeedback("/comando/utilizadores", "erro", "Defina uma senha com pelo menos 6 caracteres.");
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  let userId = data.id;

  if (data.id) {
    const before = await prisma.user.findUnique({ where: { id: data.id }, select: { username: true, name: true, rank: true, role: true, active: true } });
    const updated = await prisma.user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        rank: data.rank,
        role: data.role,
        active: data.active,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
    userId = updated.id;
    await createAuditLog({
      actorId: commander.id,
      action: "USER_UPDATED",
      entityType: "user",
      entityId: updated.id,
      before: before ?? undefined,
      after: { username: updated.username, name: updated.name, rank: updated.rank, role: updated.role, active: updated.active },
    });
  } else {
    const created = await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        rank: data.rank,
        role: data.role,
        active: data.active,
        passwordHash: passwordHash!,
      },
    });
    userId = created.id;
    await createAuditLog({
      actorId: commander.id,
      action: "USER_CREATED",
      entityType: "user",
      entityId: created.id,
      after: { username: created.username, role: created.role },
    });
  }

  revalidatePath("/comando");
  revalidatePath("/comando/utilizadores");
  redirectWithFeedback("/comando/utilizadores", "sucesso", userId ? "Utilizador guardado com sucesso." : "Operação concluída.");
}

export async function toggleUserStatusAction(formData: FormData) {
  const commander = await requireCommander();
  const userId = normalizeText(formData.get("userId"));

  if (!userId || userId === commander.id) {
    redirectWithFeedback("/comando/utilizadores", "erro", "Não pode desativar o seu próprio utilizador.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    redirectWithFeedback("/comando/utilizadores", "erro", "Utilizador não encontrado.");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { active: !user.active },
  });

  await createAuditLog({
    actorId: commander.id,
    action: updated.active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "user",
    entityId: updated.id,
    before: { active: user.active },
    after: { active: updated.active },
  });

  revalidatePath("/comando/utilizadores");
  redirectWithFeedback("/comando/utilizadores", "sucesso", "Estado do utilizador atualizado.");
}

export async function saveAircraftAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = aircraftSchema.safeParse({
    id: normalizeText(formData.get("id")) || undefined,
    code: normalizeText(formData.get("code")),
    model: normalizeText(formData.get("model")),
    tailNumber: normalizeText(formData.get("tailNumber")),
    notes: normalizeText(formData.get("notes")),
    active: parseBoolean(formData.get("active")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/aeronaves", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const data = parsed.data;
  const saved = data.id
    ? await prisma.aircraft.update({ where: { id: data.id }, data })
    : await prisma.aircraft.create({ data });

  await createAuditLog({
    actorId: commander.id,
    action: data.id ? "AIRCRAFT_UPDATED" : "AIRCRAFT_CREATED",
    entityType: "aircraft",
    entityId: saved.id,
  });

  revalidatePath("/comando/aeronaves");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/comando/aeronaves", "sucesso", "Aeronave guardada com sucesso.");
}

export async function saveMissionTypeAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = missionTypeSchema.safeParse({
    id: normalizeText(formData.get("id")) || undefined,
    name: normalizeText(formData.get("name")),
    description: normalizeText(formData.get("description")),
    active: parseBoolean(formData.get("active")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/missoes", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const data = parsed.data;
  const saved = data.id
    ? await prisma.missionType.update({ where: { id: data.id }, data })
    : await prisma.missionType.create({ data });

  await createAuditLog({
    actorId: commander.id,
    action: data.id ? "MISSION_TYPE_UPDATED" : "MISSION_TYPE_CREATED",
    entityType: "missionType",
    entityId: saved.id,
  });

  revalidatePath("/comando/missoes");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/comando/missoes", "sucesso", "Tipo de missão guardado.");
}

export async function saveHourLimitAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = hourLimitSchema.safeParse({
    id: normalizeText(formData.get("id")) || undefined,
    period: normalizeText(formData.get("period")),
    maxMinutes: normalizeText(formData.get("maxMinutes")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/limites", "erro", parsed.error.issues[0]?.message ?? "Limite inválido.");
  }

  const data = parsed.data;
  const existing = await prisma.hourLimit.findUnique({ where: { period: data.period } });
  const saved = await prisma.hourLimit.upsert({
    where: { period: data.period },
    update: { maxMinutes: data.maxMinutes },
    create: { period: data.period, maxMinutes: data.maxMinutes },
  });

  await createAuditLog({
    actorId: commander.id,
    action: "HOUR_LIMIT_UPDATED",
    entityType: "hourLimit",
    entityId: saved.id,
    before: existing ? { maxMinutes: existing.maxMinutes } : undefined,
    after: { period: saved.period, maxMinutes: saved.maxMinutes },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/limites");
  revalidatePath("/tripulante");
  redirectWithFeedback("/comando/limites", "sucesso", "Limite atualizado.");
}

// Phase 4.2: Save per-user hour limit override
export async function saveUserHourLimitAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = userHourLimitSchema.safeParse({
    userId: normalizeText(formData.get("userId")),
    period: normalizeText(formData.get("period")),
    maxMinutes: normalizeText(formData.get("maxMinutes")),
    reason: normalizeText(formData.get("reason")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/limites", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const data = parsed.data;

  const existing = await prisma.userHourLimit.findUnique({
    where: { userId_period: { userId: data.userId, period: data.period } },
  });

  const saved = await prisma.userHourLimit.upsert({
    where: { userId_period: { userId: data.userId, period: data.period } },
    update: { maxMinutes: data.maxMinutes, reason: data.reason },
    create: { userId: data.userId, period: data.period, maxMinutes: data.maxMinutes, reason: data.reason },
  });

  await createAuditLog({
    actorId: commander.id,
    action: "USER_HOUR_LIMIT_UPDATED",
    entityType: "userHourLimit",
    entityId: saved.id,
    before: existing ? { maxMinutes: existing.maxMinutes } : undefined,
    after: { userId: data.userId, period: data.period, maxMinutes: data.maxMinutes, reason: data.reason },
  });

  revalidatePath("/comando/limites");
  revalidatePath("/tripulante");
  redirectWithFeedback("/comando/limites", "sucesso", "Limite individual atualizado.");
}

// Phase 4.2: Delete per-user hour limit override (revert to global)
export async function deleteUserHourLimitAction(formData: FormData) {
  const commander = await requireCommander();
  const overrideId = normalizeText(formData.get("overrideId"));

  if (!overrideId) {
    redirectWithFeedback("/comando/limites", "erro", "Limite inválido.");
  }

  const override = await prisma.userHourLimit.findUnique({ where: { id: overrideId } });
  if (!override) {
    redirectWithFeedback("/comando/limites", "erro", "Limite não encontrado.");
  }

  await prisma.userHourLimit.delete({ where: { id: overrideId } });

  await createAuditLog({
    actorId: commander.id,
    action: "USER_HOUR_LIMIT_DELETED",
    entityType: "userHourLimit",
    entityId: overrideId,
    before: { userId: override.userId, period: override.period, maxMinutes: override.maxMinutes },
  });

  revalidatePath("/comando/limites");
  revalidatePath("/tripulante");
  redirectWithFeedback("/comando/limites", "sucesso", "Limite individual removido. Valor global restaurado.");
}

// Phase 4.2: Create temporary limit exemption
export async function saveLimitExemptionAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = limitExemptionSchema.safeParse({
    userId: normalizeText(formData.get("userId")),
    period: normalizeText(formData.get("period")),
    validFrom: normalizeText(formData.get("validFrom")),
    validUntil: normalizeText(formData.get("validUntil")),
    justification: normalizeText(formData.get("justification")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/limites", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const data = parsed.data;
  const validFrom = new Date(data.validFrom);
  const validUntil = new Date(data.validUntil);

  if (validUntil <= validFrom) {
    redirectWithFeedback("/comando/limites", "erro", "A data de fim deve ser posterior à data de início.");
  }

  const exemption = await prisma.limitExemption.create({
    data: {
      userId: data.userId,
      period: data.period,
      validFrom,
      validUntil,
      justification: data.justification,
      grantedById: commander.id,
      active: true,
    },
  });

  await createAuditLog({
    actorId: commander.id,
    action: "LIMIT_EXEMPTION_CREATED",
    entityType: "limitExemption",
    entityId: exemption.id,
    after: { userId: data.userId, period: data.period, validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString(), justification: data.justification },
  });

  revalidatePath("/comando/limites");
  revalidatePath("/tripulante");
  redirectWithFeedback("/comando/limites", "sucesso", "Isenção temporária criada.");
}

// Phase 4.2: Deactivate limit exemption
export async function deactivateLimitExemptionAction(formData: FormData) {
  const commander = await requireCommander();
  const exemptionId = normalizeText(formData.get("exemptionId"));

  if (!exemptionId) {
    redirectWithFeedback("/comando/limites", "erro", "Isenção inválida.");
  }

  const exemption = await prisma.limitExemption.findUnique({ where: { id: exemptionId } });
  if (!exemption) {
    redirectWithFeedback("/comando/limites", "erro", "Isenção não encontrada.");
  }

  await prisma.limitExemption.update({ where: { id: exemptionId }, data: { active: false } });

  await createAuditLog({
    actorId: commander.id,
    action: "LIMIT_EXEMPTION_DEACTIVATED",
    entityType: "limitExemption",
    entityId: exemptionId,
  });

  revalidatePath("/comando/limites");
  revalidatePath("/tripulante");
  redirectWithFeedback("/comando/limites", "sucesso", "Isenção desativada.");
}

export async function approveFlightLogAction(formData: FormData) {
  const commander = await requireCommander();
  const flightLogId = normalizeText(formData.get("flightLogId"));

  if (!flightLogId) {
    redirectWithFeedback("/comando/aprovacoes", "erro", "Registo inválido.");
  }

  const flightLog = await prisma.flightLog.findUnique({
    where: { id: flightLogId },
    include: { crewMember: true },
  });

  if (!flightLog || flightLog.status !== FlightLogStatus.SUBMITTED) {
    redirectWithFeedback("/comando/aprovacoes", "erro", "Registo não disponível para aprovação.");
  }

  await prisma.flightLog.update({
    where: { id: flightLog.id },
    data: {
      status: FlightLogStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: commander.id,
      rejectionReason: null,
    },
  });

  await notifyUsers(
    [flightLog.crewMemberId],
    "Registo aprovado",
    `O registo de voo de ${flightLog.crewMember.name} foi aprovado.`,
    "/tripulante/registos",
  );

  await createAuditLog({
    actorId: commander.id,
    action: "FLIGHT_LOG_APPROVED",
    entityType: "flightLog",
    entityId: flightLog.id,
    before: { status: flightLog.status },
    after: { status: FlightLogStatus.APPROVED },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/aprovacoes");
  revalidatePath("/tripulante");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/comando/aprovacoes", "sucesso", "Registo aprovado.");
}

export async function rejectFlightLogAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = rejectionSchema.safeParse({
    flightLogId: normalizeText(formData.get("flightLogId")),
    rejectionReason: normalizeText(formData.get("rejectionReason")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/aprovacoes", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const data = parsed.data;
  const flightLog = await prisma.flightLog.findUnique({
    where: { id: data.flightLogId },
    include: { crewMember: true },
  });

  if (!flightLog || flightLog.status !== FlightLogStatus.SUBMITTED) {
    redirectWithFeedback("/comando/aprovacoes", "erro", "Registo não disponível para rejeição.");
  }

  await prisma.flightLog.update({
    where: { id: flightLog.id },
    data: {
      status: FlightLogStatus.REJECTED,
      rejectionReason: data.rejectionReason,
      approvedAt: null,
      approvedById: commander.id,
    },
  });

  await notifyUsers(
    [flightLog.crewMemberId],
    "Registo rejeitado",
    `O seu registo de voo foi rejeitado: ${data.rejectionReason}`,
    `/tripulante/registos/${flightLog.id}`,
  );

  await createAuditLog({
    actorId: commander.id,
    action: "FLIGHT_LOG_REJECTED",
    entityType: "flightLog",
    entityId: flightLog.id,
    before: { status: flightLog.status },
    after: { status: FlightLogStatus.REJECTED, rejectionReason: data.rejectionReason },
  });

  revalidatePath("/comando/aprovacoes");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/comando/aprovacoes", "sucesso", "Registo rejeitado.");
}

export async function batchApproveFlightLogsAction(formData: FormData) {
  const commander = await requireCommander();
  const ids = formData
    .getAll("flightLogIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  if (ids.length === 0) {
    redirectWithFeedback("/comando/aprovacoes", "erro", "Selecione pelo menos um registo.");
  }

  const logs = await prisma.flightLog.findMany({
    where: { id: { in: ids }, status: FlightLogStatus.SUBMITTED },
  });

  if (logs.length === 0) {
    redirectWithFeedback("/comando/aprovacoes", "erro", "Nenhum registo elegível foi encontrado.");
  }

  await prisma.flightLog.updateMany({
    where: { id: { in: logs.map((log) => log.id) }, status: FlightLogStatus.SUBMITTED },
    data: {
      status: FlightLogStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: commander.id,
      rejectionReason: null,
    },
  });

  await notifyUsers(
    logs.map((log) => log.crewMemberId),
    "Registo aprovado em lote",
    "Um ou mais registos submetidos foram aprovados.",
    "/tripulante/registos",
  );

  await createAuditLog({
    actorId: commander.id,
    action: "FLIGHT_LOG_BATCH_APPROVED",
    entityType: "flightLog",
    entityId: logs.map((log) => log.id).join(","),
    details: { count: logs.length },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/aprovacoes");
  revalidatePath("/tripulante");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/comando/aprovacoes", "sucesso", `${logs.length} registos aprovados.`);
}

function dedupeUserIds(userIds: string[]) {
  return [...new Set(userIds)];
}

function extractDutyScheduleAssignments(formData: FormData) {
  const selectedUserIds = dedupeUserIds(
    formData
      .getAll("assignmentSelected")
      .map((value) => (typeof value === "string" ? value : ""))
      .filter(Boolean),
  );

  return selectedUserIds.map((userId) => ({
    userId,
    roleLabel: normalizeText(formData.get(`assignmentRole-${userId}`)) || undefined,
    notes: normalizeText(formData.get(`assignmentNotes-${userId}`)) || undefined,
  }));
}

export async function saveDutyScheduleAction(formData: FormData) {
  const commander = await requireCommander();
  const parsed = dutyScheduleSchema.safeParse({
    id: normalizeText(formData.get("id")) || undefined,
    title: normalizeText(formData.get("title")),
    description: normalizeText(formData.get("description")),
    location: normalizeText(formData.get("location")),
    startAt: normalizeText(formData.get("startAt")),
    endAt: normalizeText(formData.get("endAt")),
  });

  if (!parsed.success) {
    redirectWithFeedback("/comando/escalas", "erro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const assignments = extractDutyScheduleAssignments(formData);

  if (assignments.length === 0) {
    redirectWithFeedback("/comando/escalas", "erro", "Selecione pelo menos um tripulante para a escala.");
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    redirectWithFeedback("/comando/escalas", "erro", "Datas da escala inválidas.");
  }

  if (endAt <= startAt) {
    redirectWithFeedback("/comando/escalas", "erro", "A data final deve ser posterior à data inicial.");
  }

  const existing = parsed.data.id
    ? await prisma.dutySchedule.findUnique({
        where: { id: parsed.data.id },
        include: { assignments: true },
      })
    : null;

  if (existing?.status === DutyScheduleStatus.CANCELLED) {
    redirectWithFeedback("/comando/escalas", "erro", "Uma escala cancelada não pode ser alterada.");
  }

  const overlappingAssignments = await prisma.dutyScheduleAssignment.findMany({
    where: {
      userId: { in: assignments.map((assignment) => assignment.userId) },
      scheduleId: parsed.data.id ? { not: parsed.data.id } : undefined,
      schedule: { status: { not: DutyScheduleStatus.CANCELLED } },
    },
    include: { user: true, schedule: true },
  });

  const actualConflicts = overlappingAssignments.filter((assignment) =>
    overlapsInterval(startAt, endAt, assignment.schedule.startAt, assignment.schedule.endAt),
  );

  const previousAssigneeIds = existing?.assignments.map((assignment) => assignment.userId) ?? [];
  const nextStatus =
    existing?.status === DutyScheduleStatus.PUBLISHED || existing?.status === DutyScheduleStatus.CHANGED
      ? DutyScheduleStatus.CHANGED
      : existing?.status ?? DutyScheduleStatus.DRAFT;

  const saved = await prisma.$transaction(async (transaction) => {
    const schedule = existing
      ? await transaction.dutySchedule.update({
          where: { id: existing.id },
          data: {
            title: parsed.data.title,
            description: parsed.data.description || undefined,
            location: parsed.data.location || undefined,
            startAt,
            endAt,
            status: nextStatus,
            cancelledAt: null,
          },
        })
      : await transaction.dutySchedule.create({
          data: {
            title: parsed.data.title,
            description: parsed.data.description || undefined,
            location: parsed.data.location || undefined,
            startAt,
            endAt,
            status: DutyScheduleStatus.DRAFT,
          },
        });

    await transaction.dutyScheduleAssignment.deleteMany({ where: { scheduleId: schedule.id } });
    await transaction.dutyScheduleAssignment.createMany({
      data: assignments.map((assignment) => ({
        scheduleId: schedule.id,
        userId: assignment.userId,
        roleLabel: assignment.roleLabel,
        notes: assignment.notes,
      })),
    });

    return schedule;
  });

  const currentAssigneeIds = assignments.map((assignment) => assignment.userId);
  const affectedUserIds = dedupeUserIds([...previousAssigneeIds, ...currentAssigneeIds]);

  if (existing && nextStatus === DutyScheduleStatus.CHANGED) {
    await notifyUsers(
      affectedUserIds,
      "Escala alterada",
      `A escala "${saved.title}" foi alterada e aguarda consulta atualizada.`,
      "/tripulante/escalas",
    );
  }

  await createAuditLog({
    actorId: commander.id,
    action: existing ? "DUTY_SCHEDULE_UPDATED" : "DUTY_SCHEDULE_CREATED",
    entityType: "dutySchedule",
    entityId: saved.id,
    details: {
      status: existing ? nextStatus : DutyScheduleStatus.DRAFT,
      crewCount: assignments.length,
      conflictCount: actualConflicts.length,
    },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/escalas");
  revalidatePath("/tripulante");
  revalidatePath("/tripulante/escalas");

  if (actualConflicts.length > 0) {
    const names = dedupeUserIds(actualConflicts.map((assignment) => assignment.user.name)).join(", ");
    redirectWithFeedback("/comando/escalas", "sucesso", `Escala guardada. Atenção aos conflitos de ${names}.`);
  }

  redirectWithFeedback("/comando/escalas", "sucesso", existing ? "Escala atualizada com sucesso." : "Escala criada em rascunho.");
}

export async function publishDutyScheduleAction(formData: FormData) {
  const commander = await requireCommander();
  const scheduleId = normalizeText(formData.get("scheduleId"));

  if (!scheduleId) {
    redirectWithFeedback("/comando/escalas", "erro", "Escala inválida.");
  }

  const schedule = await prisma.dutySchedule.findUnique({
    where: { id: scheduleId },
    include: {
      assignments: {
        include: { user: true },
      },
    },
  });

  if (!schedule) {
    redirectWithFeedback("/comando/escalas", "erro", "Escala não encontrada.");
  }

  if (schedule.status === DutyScheduleStatus.CANCELLED) {
    redirectWithFeedback("/comando/escalas", "erro", "Não é possível publicar uma escala cancelada.");
  }

  await prisma.dutySchedule.update({
    where: { id: schedule.id },
    data: { status: DutyScheduleStatus.PUBLISHED, publishedAt: new Date() },
  });

  await notifyUsers(
    schedule.assignments.map((assignment) => assignment.userId),
    "Escala publicada",
    `Foi publicada a escala "${schedule.title}" com início em ${schedule.startAt.toLocaleString("pt-PT")}.`,
    "/tripulante/escalas",
  );

  await createAuditLog({
    actorId: commander.id,
    action: "DUTY_SCHEDULE_PUBLISHED",
    entityType: "dutySchedule",
    entityId: schedule.id,
    before: { status: schedule.status },
    after: { status: DutyScheduleStatus.PUBLISHED },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/escalas");
  revalidatePath("/tripulante");
  revalidatePath("/tripulante/escalas");
  redirectWithFeedback("/comando/escalas", "sucesso", "Escala publicada e notificada.");
}

export async function cancelDutyScheduleAction(formData: FormData) {
  const commander = await requireCommander();
  const scheduleId = normalizeText(formData.get("scheduleId"));

  if (!scheduleId) {
    redirectWithFeedback("/comando/escalas", "erro", "Escala inválida.");
  }

  const schedule = await prisma.dutySchedule.findUnique({
    where: { id: scheduleId },
    include: { assignments: true },
  });

  if (!schedule) {
    redirectWithFeedback("/comando/escalas", "erro", "Escala não encontrada.");
  }

  if (schedule.status === DutyScheduleStatus.CANCELLED) {
    redirectWithFeedback("/comando/escalas", "erro", "A escala já se encontra cancelada.");
  }

  await prisma.dutySchedule.update({
    where: { id: schedule.id },
    data: { status: DutyScheduleStatus.CANCELLED, cancelledAt: new Date() },
  });

  await notifyUsers(
    schedule.assignments.map((assignment) => assignment.userId),
    "Escala cancelada",
    `A escala "${schedule.title}" foi cancelada pelo comando.`,
    "/tripulante/escalas",
  );

  await createAuditLog({
    actorId: commander.id,
    action: "DUTY_SCHEDULE_CANCELLED",
    entityType: "dutySchedule",
    entityId: schedule.id,
    before: { status: schedule.status },
    after: { status: DutyScheduleStatus.CANCELLED },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/escalas");
  revalidatePath("/tripulante");
  revalidatePath("/tripulante/escalas");
  redirectWithFeedback("/comando/escalas", "sucesso", "Escala cancelada com sucesso.");
}
