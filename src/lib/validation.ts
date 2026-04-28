import { LimitPeriod, Role } from "@prisma/client";
import { z } from "zod";

export const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, "Utilizador inválido."),
  name: z.string().min(3, "Nome obrigatório."),
  rank: z.string().optional(),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  active: z.boolean(),
});

export const userFormSchema = userSchema.refine(
  (value) => value.id || (value.password?.length ?? 0) >= 6,
  "Defina uma senha com pelo menos 6 caracteres.",
);

export const aircraftSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Código obrigatório."),
  model: z.string().min(2, "Modelo obrigatório."),
  tailNumber: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean(),
});

export const missionTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Tipo de missão obrigatório."),
  description: z.string().optional(),
  active: z.boolean(),
});

export const hourLimitSchema = z.object({
  id: z.string().optional(),
  period: z.nativeEnum(LimitPeriod),
  maxMinutes: z.coerce.number().int().positive("Limite inválido."),
});

export const flightLogSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, "Data obrigatória."),
  aircraftId: z.string().min(1, "Aeronave obrigatória."),
  missionTypeId: z.string().min(1, "Missão obrigatória."),
  origin: z.string().min(2, "Origem obrigatória."),
  destination: z.string().min(2, "Destino obrigatório."),
  departureTime: z.string().min(1, "Hora de partida obrigatória."),
  arrivalTime: z.string().min(1, "Hora de chegada obrigatória."),
  dutyRole: z.string().min(2, "Função a bordo obrigatória."),
  notes: z.string().optional(),
  otherCrewMemberIds: z.array(z.string()).default([]),
});

export const rejectionSchema = z.object({
  flightLogId: z.string().min(1),
  rejectionReason: z.string().min(5, "Indique a razão da rejeição."),
});

export const dutyScheduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Título da escala obrigatório."),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().min(1, "Data de início obrigatória."),
  endAt: z.string().min(1, "Data de fim obrigatória."),
});

// Phase 4.2: Per-user hour limit override schema
export const userHourLimitSchema = z.object({
  userId: z.string().min(1, "Utilizador obrigatório."),
  period: z.nativeEnum(LimitPeriod),
  maxMinutes: z.coerce.number().int().min(0, "Limite inválido."),
  reason: z.string().optional(),
});

// Phase 4.2: Temporary limit exemption schema
export const limitExemptionSchema = z.object({
  userId: z.string().min(1, "Utilizador obrigatório."),
  period: z.nativeEnum(LimitPeriod),
  validFrom: z.string().min(1, "Data de início obrigatória."),
  validUntil: z.string().min(1, "Data de fim obrigatória."),
  justification: z.string().min(5, "Justificação obrigatória (mínimo 5 caracteres)."),
});