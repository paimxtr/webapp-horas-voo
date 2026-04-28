"use server";

import { FlightLogStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAuditLog, notifyUsers } from "@/lib/audit";
import { requireCrewMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirectWithFeedback } from "@/lib/feedback";
import { calculateDurationMinutes, combineDateAndTime, normalizeText } from "@/lib/utils";
import { flightLogSchema } from "@/lib/validation";

function buildFlightLogPayload(formData: FormData) {
  const otherCrewMemberIds = formData
    .getAll("otherCrewMemberIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  const parsed = flightLogSchema.safeParse({
    id: normalizeText(formData.get("id")) || undefined,
    date: normalizeText(formData.get("date")),
    aircraftId: normalizeText(formData.get("aircraftId")),
    missionTypeId: normalizeText(formData.get("missionTypeId")),
    origin: normalizeText(formData.get("origin")),
    destination: normalizeText(formData.get("destination")),
    departureTime: normalizeText(formData.get("departureTime")),
    arrivalTime: normalizeText(formData.get("arrivalTime")),
    dutyRole: normalizeText(formData.get("dutyRole")),
    notes: normalizeText(formData.get("notes")),
    otherCrewMemberIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const departure = combineDateAndTime(parsed.data.date, parsed.data.departureTime);
  const arrival = combineDateAndTime(parsed.data.date, parsed.data.arrivalTime);
  const durationMinutes = calculateDurationMinutes(departure, arrival);

  if (durationMinutes <= 0) {
    return { error: "A duração do voo deve ser superior a zero." };
  }

  return {
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      departureTime: departure,
      arrivalTime: arrival <= departure ? new Date(arrival.getTime() + 24 * 60 * 60 * 1000) : arrival,
      durationMinutes,
      otherCrewMemberIds: [...new Set(parsed.data.otherCrewMemberIds)],
    },
  };
}

async function resolveOtherCrewMemberIds(userId: string, candidateIds: string[]): Promise<{ ids: string[] } | { error: string }> {
  const filteredIds = [...new Set(candidateIds)].filter((crewMemberId) => crewMemberId !== userId);

  if (filteredIds.length === 0) {
    return { ids: [] };
  }

  const validCrewMembers = await prisma.user.findMany({
    where: { id: { in: filteredIds }, role: Role.CREW_MEMBER, active: true },
    select: { id: true },
  });

  if (validCrewMembers.length !== filteredIds.length) {
    return { error: "Selecione apenas tripulantes ativos válidos." };
  }

  return { ids: validCrewMembers.map((crewMember) => crewMember.id) };
}

export async function createFlightLogAction(formData: FormData) {
  const user = await requireCrewMember();
  const parsed = buildFlightLogPayload(formData);

  if ("error" in parsed) {
    redirectWithFeedback("/tripulante/registos", "erro", parsed.error ?? "Dados inválidos.");
  }

  const otherCrewMembers = await resolveOtherCrewMemberIds(user.id, parsed.data.otherCrewMemberIds);

  if ("error" in otherCrewMembers) {
    redirectWithFeedback("/tripulante/registos", "erro", otherCrewMembers.error);
  }

  const log = await prisma.flightLog.create({
    data: {
      crewMemberId: user.id,
      aircraftId: parsed.data.aircraftId,
      missionTypeId: parsed.data.missionTypeId,
      date: parsed.data.date,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      departureTime: parsed.data.departureTime,
      arrivalTime: parsed.data.arrivalTime,
      durationMinutes: parsed.data.durationMinutes,
      dutyRole: parsed.data.dutyRole,
      notes: parsed.data.notes,
      status: FlightLogStatus.DRAFT,
      otherCrewMembers: {
        connect: otherCrewMembers.ids.map((id) => ({ id })),
      },
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: "FLIGHT_LOG_CREATED",
    entityType: "flightLog",
    entityId: log.id,
    after: { status: FlightLogStatus.DRAFT, origin: log.origin, destination: log.destination, durationMinutes: log.durationMinutes },
  });

  revalidatePath("/tripulante");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/tripulante/registos", "sucesso", "Registo criado em rascunho.");
}

export async function updateFlightLogAction(formData: FormData) {
  const user = await requireCrewMember();
  const parsed = buildFlightLogPayload(formData);
  const logId = normalizeText(formData.get("id"));

  if (!logId) {
    redirectWithFeedback("/tripulante/registos", "erro", "Registo inválido.");
  }

  if ("error" in parsed) {
    redirectWithFeedback(`/tripulante/registos/${logId}`, "erro", parsed.error ?? "Dados inválidos.");
  }

  const otherCrewMembers = await resolveOtherCrewMemberIds(user.id, parsed.data.otherCrewMemberIds);

  if ("error" in otherCrewMembers) {
    redirectWithFeedback(`/tripulante/registos/${logId}`, "erro", otherCrewMembers.error);
  }

  const existing = await prisma.flightLog.findFirst({
    where: { id: logId, crewMemberId: user.id },
  });

  if (!existing || (existing.status !== FlightLogStatus.DRAFT && existing.status !== FlightLogStatus.REJECTED)) {
    redirectWithFeedback("/tripulante/registos", "erro", "Apenas rascunhos ou rejeitados podem ser editados.");
  }

  await prisma.flightLog.update({
    where: { id: logId },
    data: {
      aircraftId: parsed.data.aircraftId,
      missionTypeId: parsed.data.missionTypeId,
      date: parsed.data.date,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      departureTime: parsed.data.departureTime,
      arrivalTime: parsed.data.arrivalTime,
      durationMinutes: parsed.data.durationMinutes,
      dutyRole: parsed.data.dutyRole,
      notes: parsed.data.notes,
      otherCrewMembers: {
        set: otherCrewMembers.ids.map((id) => ({ id })),
      },
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: "FLIGHT_LOG_UPDATED",
    entityType: "flightLog",
    entityId: logId,
    before: {
      origin: existing.origin,
      destination: existing.destination,
      durationMinutes: existing.durationMinutes,
      dutyRole: existing.dutyRole,
      notes: existing.notes,
    },
    after: {
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      durationMinutes: parsed.data.durationMinutes,
      dutyRole: parsed.data.dutyRole,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/tripulante/registos");
  revalidatePath(`/tripulante/registos/${logId}`);
  redirectWithFeedback(`/tripulante/registos/${logId}`, "sucesso", "Registo atualizado.");
}

export async function submitFlightLogAction(formData: FormData) {
  const user = await requireCrewMember();
  const logId = normalizeText(formData.get("flightLogId"));

  if (!logId) {
    redirectWithFeedback("/tripulante/registos", "erro", "Registo inválido.");
  }

  const log = await prisma.flightLog.findFirst({
    where: { id: logId, crewMemberId: user.id },
  });

  if (!log || (log.status !== FlightLogStatus.DRAFT && log.status !== FlightLogStatus.REJECTED)) {
    redirectWithFeedback("/tripulante/registos", "erro", "O registo não pode ser submetido.");
  }

  await prisma.flightLog.update({
    where: { id: log.id },
    data: {
      status: FlightLogStatus.SUBMITTED,
      submittedAt: new Date(),
      rejectionReason: null,
      approvedAt: null,
      approvedById: null,
    },
  });

  const commanders = await prisma.user.findMany({
    where: { role: Role.COMMANDER, active: true },
    select: { id: true },
  });

  await notifyUsers(
    commanders.map((commander) => commander.id),
    "Novo registo submetido",
    `${user.name} submeteu um novo registo de voo.`,
    "/comando/aprovacoes",
  );

  await createAuditLog({
    actorId: user.id,
    action: "FLIGHT_LOG_SUBMITTED",
    entityType: "flightLog",
    entityId: log.id,
    before: { status: log.status },
    after: { status: FlightLogStatus.SUBMITTED },
  });

  revalidatePath("/comando");
  revalidatePath("/comando/aprovacoes");
  revalidatePath("/tripulante");
  revalidatePath("/tripulante/registos");
  redirectWithFeedback("/tripulante/registos", "sucesso", "Registo submetido para aprovação.");
}

// Phase 4.3: Delete flight log attachment
export async function deleteAttachmentAction(formData: FormData) {
  const user = await requireCrewMember();
  const attachmentId = normalizeText(formData.get("attachmentId"));
  const flightLogId = normalizeText(formData.get("flightLogId"));

  if (!attachmentId || !flightLogId) {
    redirectWithFeedback(`/tripulante/registos/${flightLogId}`, "erro", "Anexo inválido.");
  }

  const attachment = await prisma.flightLogAttachment.findFirst({
    where: { id: attachmentId, flightLogId, uploadedById: user.id },
  });

  if (!attachment) {
    redirectWithFeedback(`/tripulante/registos/${flightLogId}`, "erro", "Anexo não encontrado.");
  }

  // Delete the physical file
  const { unlink } = await import("fs/promises");
  const { join } = await import("path");
  const filePath = join(process.cwd(), "public", "uploads", attachment.filename);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone, continue
  }

  await prisma.flightLogAttachment.delete({ where: { id: attachmentId } });

  await createAuditLog({
    actorId: user.id,
    action: "ATTACHMENT_DELETED",
    entityType: "flightLogAttachment",
    entityId: attachmentId,
    details: { flightLogId, filename: attachment.filename },
  });

  revalidatePath(`/tripulante/registos/${flightLogId}`);
  redirectWithFeedback(`/tripulante/registos/${flightLogId}`, "sucesso", "Anexo removido.");
}
