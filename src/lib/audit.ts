import { prisma } from "@/lib/db";

type AuditInput = {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  // Phase 4.4: before/after for change history
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
  const details: Record<string, unknown> = { ...(input.details ?? {}) };

  if (input.before !== undefined) {
    details.before = input.before;
  }
  if (input.after !== undefined) {
    details.after = input.after;
  }

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      details: Object.keys(details).length > 0 ? JSON.stringify(details) : undefined,
    },
  });
}

export async function notifyUsers(userIds: string[], title: string, message: string, link?: string) {
  if (userIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title,
      message,
      link,
    })),
  });
}
