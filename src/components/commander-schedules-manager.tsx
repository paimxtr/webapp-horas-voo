"use client";

import { addMonths, addWeeks, format, isSameDay, isSameMonth, startOfDay, subMonths, subWeeks } from "date-fns";
import { CalendarDays, Clock3, MapPin, ShieldAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { cancelDutyScheduleAction, publishDutyScheduleAction, saveDutyScheduleAction } from "@/actions/commander-actions";
import { ConfirmDialog } from "@/components/confirmation-dialog";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCalendarDays,
  dutyScheduleStatusLabels,
  formatDateTimeLocalInput,
  getDutyScheduleStatusVariant,
  getLimitLevelLabel,
  getLimitLevelVariant,
  overlapsInterval,
} from "@/lib/schedules";
import { cn, formatDateTime } from "@/lib/utils";

type CrewMemberOption = {
  id: string;
  name: string;
  rank: string | null;
  limitLevel: "green" | "yellow" | "red";
  limitStatuses: {
    id: string;
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    percentage: number;
    level: "green" | "yellow" | "red" | "exceeded";
  }[];
};

type ScheduleAssignment = {
  id: string;
  userId: string;
  userName: string;
  roleLabel: string | null;
  notes: string | null;
};

type ScheduleRecord = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "PUBLISHED" | "CHANGED" | "CANCELLED";
  assignments: ScheduleAssignment[];
};

type AssignmentFormState = Record<
  string,
  {
    selected: boolean;
    roleLabel: string;
    notes: string;
  }
>;

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const periodLabels: Record<CrewMemberOption["limitStatuses"][number]["period"], string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

function buildInitialAssignments(
  crewMembers: CrewMemberOption[],
  schedule?: ScheduleRecord | null,
): AssignmentFormState {
  return crewMembers.reduce<AssignmentFormState>((accumulator, member) => {
    const assignment = schedule?.assignments.find((item) => item.userId === member.id);
    accumulator[member.id] = {
      selected: Boolean(assignment),
      roleLabel: assignment?.roleLabel ?? "",
      notes: assignment?.notes ?? "",
    };
    return accumulator;
  }, {});
}

function getScheduleWindowLabel(referenceDate: Date, view: "month" | "week") {
  if (view === "week") {
    const days = buildCalendarDays(referenceDate, "week");
    return `${format(days[0], "dd/MM")} - ${format(days[days.length - 1], "dd/MM/yyyy")}`;
  }

  return format(referenceDate, "MMMM yyyy");
}

function getDefaultEndAtValue() {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  return formatDateTimeLocalInput(date);
}

function ScheduleEditor({
  selectedSchedule,
  crewMembers,
  schedules,
  onCreateNew,
}: {
  selectedSchedule: ScheduleRecord | null;
  crewMembers: CrewMemberOption[];
  schedules: ScheduleRecord[];
  onCreateNew: () => void;
}) {
  const [title, setTitle] = useState(selectedSchedule?.title ?? "");
  const [description, setDescription] = useState(selectedSchedule?.description ?? "");
  const [location, setLocation] = useState(selectedSchedule?.location ?? "");
  const [startAt, setStartAt] = useState(
    selectedSchedule?.startAt.slice(0, 16) ?? formatDateTimeLocalInput(new Date()),
  );
  const [endAt, setEndAt] = useState(selectedSchedule?.endAt.slice(0, 16) ?? getDefaultEndAtValue());
  const [assignments, setAssignments] = useState<AssignmentFormState>(() =>
    buildInitialAssignments(crewMembers, selectedSchedule),
  );

  const conflictsByUser = useMemo(() => {
    const parsedStartAt = startAt ? new Date(startAt) : null;
    const parsedEndAt = endAt ? new Date(endAt) : null;

    if (
      !parsedStartAt ||
      !parsedEndAt ||
      Number.isNaN(parsedStartAt.getTime()) ||
      Number.isNaN(parsedEndAt.getTime()) ||
      parsedEndAt <= parsedStartAt
    ) {
      return {} as Record<string, ScheduleRecord[]>;
    }

    return crewMembers.reduce<Record<string, ScheduleRecord[]>>((accumulator, member) => {
      accumulator[member.id] = schedules.filter((schedule) => {
        if (schedule.id === selectedSchedule?.id || schedule.status === "CANCELLED") {
          return false;
        }

        if (!schedule.assignments.some((assignment) => assignment.userId === member.id)) {
          return false;
        }

        return overlapsInterval(parsedStartAt, parsedEndAt, new Date(schedule.startAt), new Date(schedule.endAt));
      });

      return accumulator;
    }, {});
  }, [crewMembers, endAt, schedules, selectedSchedule?.id, startAt]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>{selectedSchedule ? "Editar escala" : "Nova escala"}</CardTitle>
          <CardDescription>Criar, atualizar, publicar ou cancelar escalas da esquadra.</CardDescription>
        </div>
        <Button type="button" variant="outline" onClick={onCreateNew}>
          Nova escala
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={saveDutyScheduleAction} className="space-y-5">
          <input type="hidden" name="id" value={selectedSchedule?.id ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Prontidão Bravo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Resumo da missão, janela de prontidão e orientações."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input id="location" name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Base Aérea 27 RAVP" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startAt">Início</Label>
              <Input id="startAt" name="startAt" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">Fim</Label>
              <Input id="endAt" name="endAt" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} required />
            </div>
          </div>

          {selectedSchedule ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Badge variant={getDutyScheduleStatusVariant(selectedSchedule.status)}>
                {dutyScheduleStatusLabels[selectedSchedule.status]}
              </Badge>
              <span className="text-sm text-slate-300">Guarde alterações antes de publicar uma revisão.</span>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Atribuição de tripulantes</h3>
                <p className="text-sm text-slate-400">Indicadores a verde, amarelo e vermelho refletem a proximidade aos limites.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldAlert className="h-4 w-4 text-[#c9a958]" />
                Conflitos são assinalados em tempo real
              </div>
            </div>

            <div className="space-y-3">
              {crewMembers.map((member) => {
                const memberAssignment = assignments[member.id];
                const conflicts = conflictsByUser[member.id] ?? [];

                return (
                  <div key={member.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 text-sm text-slate-200">
                          <input
                            type="checkbox"
                            name="assignmentSelected"
                            value={member.id}
                            checked={memberAssignment.selected}
                            onChange={(event) =>
                              setAssignments((current) => ({
                                ...current,
                                [member.id]: {
                                  ...current[member.id],
                                  selected: event.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 accent-[#c9a958]"
                          />
                          <span className="font-semibold text-white">{member.name}</span>
                          <span className="text-slate-500">{member.rank ?? "Sem posto"}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getLimitLevelVariant(member.limitLevel)}>
                            {getLimitLevelLabel(member.limitLevel)}
                          </Badge>
                          {member.limitStatuses.map((status) => (
                            <Badge
                              key={status.id}
                              variant={status.level === "green" ? "success" : status.level === "yellow" ? "warning" : "danger"}
                            >
                              {periodLabels[status.period]} {Math.round(status.percentage)}%
                            </Badge>
                          ))}
                          {conflicts.length > 0 ? <Badge variant="danger">Conflito com {conflicts.length} escala(s)</Badge> : null}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#c9a958]" />
                          {conflicts.length > 0 ? conflicts.map((schedule) => schedule.title).join(", ") : "Sem conflito detetado"}
                        </div>
                      </div>
                    </div>

                    {memberAssignment.selected ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`assignmentRole-${member.id}`}>Função</Label>
                          <Input
                            id={`assignmentRole-${member.id}`}
                            name={`assignmentRole-${member.id}`}
                            value={memberAssignment.roleLabel}
                            onChange={(event) =>
                              setAssignments((current) => ({
                                ...current,
                                [member.id]: {
                                  ...current[member.id],
                                  roleLabel: event.target.value,
                                },
                              }))
                            }
                            placeholder="Piloto de serviço"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`assignmentNotes-${member.id}`}>Notas</Label>
                          <Textarea
                            id={`assignmentNotes-${member.id}`}
                            name={`assignmentNotes-${member.id}`}
                            value={memberAssignment.notes}
                            onChange={(event) =>
                              setAssignments((current) => ({
                                ...current,
                                [member.id]: {
                                  ...current[member.id],
                                  notes: event.target.value,
                                },
                              }))
                            }
                            placeholder="Observações para o tripulante."
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton>{selectedSchedule ? "Guardar alterações" : "Guardar em rascunho"}</SubmitButton>
          </div>
        </form>

        {selectedSchedule ? (
          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
            <form action={publishDutyScheduleAction}>
              <input type="hidden" name="scheduleId" value={selectedSchedule.id} />
              <SubmitButton variant="secondary">Publicar escala</SubmitButton>
            </form>
            <ConfirmDialog
              trigger={<Button variant="destructive">Cancelar escala</Button>}
              title="Cancelar escala"
              description={`Tem a certeza que pretende cancelar a escala "${selectedSchedule.title}"? Todos os tripulantes serão notificados e a escala não poderá ser reativada.`}
              confirmLabel="Cancelar escala"
              onConfirm={async () => {
                const fd = new FormData();
                fd.append("scheduleId", selectedSchedule.id);
                await cancelDutyScheduleAction(fd);
              }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CommanderSchedulesManager({
  crewMembers,
  schedules,
}: {
  crewMembers: CrewMemberOption[];
  schedules: ScheduleRecord[];
}) {
  const [view, setView] = useState<"month" | "week">("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(schedules[0]?.id ?? null);

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const calendarDays = useMemo(() => buildCalendarDays(referenceDate, view), [referenceDate, view]);
  const upcomingSchedules = useMemo(
    () =>
      [...schedules]
        .filter((schedule) => new Date(schedule.endAt) >= startOfDay(new Date()))
        .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()),
    [schedules],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Calendário operacional</CardTitle>
              <CardDescription>Visualização mensal e semanal das escalas da unidade.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={view === "month" ? "default" : "secondary"} size="sm" type="button" onClick={() => setView("month")}>
                Mensal
              </Button>
              <Button variant={view === "week" ? "default" : "secondary"} size="sm" type="button" onClick={() => setView("week")}>
                Semanal
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={() => setReferenceDate((current) => (view === "month" ? subMonths(current, 1) : subWeeks(current, 1)))}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={() => setReferenceDate((current) => (view === "month" ? addMonths(current, 1) : addWeeks(current, 1)))}>
                Seguinte
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3 text-slate-200">
                <CalendarDays className="h-5 w-5 text-[#c9a958]" />
                <span className="font-semibold capitalize">{getScheduleWindowLabel(referenceDate, view)}</span>
              </div>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{view === "month" ? "Mês" : "Semana"}</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((label) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs uppercase tracking-[0.24em] text-slate-400">
                  {label}
                </div>
              ))}
              {calendarDays.map((day) => {
                const daySchedules = schedules.filter((schedule) => isSameDay(new Date(schedule.startAt), day));

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-32 rounded-2xl border border-white/10 bg-white/5 p-3",
                      !isSameMonth(day, referenceDate) && view === "month" ? "opacity-45" : "",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", isSameDay(day, new Date()) ? "text-[#f6e7c1]" : "text-white")}>
                        {format(day, "dd")}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{daySchedules.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {daySchedules.slice(0, view === "month" ? 3 : 6).map((schedule) => (
                        <button
                          key={schedule.id}
                          type="button"
                          onClick={() => {
                            setSelectedScheduleId(schedule.id);
                            setReferenceDate(new Date(schedule.startAt));
                          }}
                          className={cn(
                            "w-full rounded-xl border px-2 py-2 text-left text-xs transition",
                            selectedScheduleId === schedule.id
                              ? "border-[#c9a958]/50 bg-[#c9a958]/10"
                              : "border-white/10 bg-black/20 hover:border-[#c9a958]/30 hover:bg-white/10",
                          )}
                        >
                          <p className="truncate font-semibold text-white">{schedule.title}</p>
                          <p className="mt-1 text-slate-400">{format(new Date(schedule.startAt), "HH:mm")}</p>
                        </button>
                      ))}
                      {daySchedules.length > (view === "month" ? 3 : 6) ? (
                        <p className="text-[11px] text-slate-500">+{daySchedules.length - (view === "month" ? 3 : 6)} adicionais</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas escalas</CardTitle>
            <CardDescription>Resumo das próximas atribuições configuradas pelo comando.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSchedules.length === 0 ? (
              <p className="text-sm text-slate-400">Sem escalas registadas.</p>
            ) : (
              upcomingSchedules.slice(0, 8).map((schedule) => (
                <button
                  key={schedule.id}
                  type="button"
                  onClick={() => setSelectedScheduleId(schedule.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition",
                    selectedScheduleId === schedule.id
                      ? "border-[#c9a958]/50 bg-[#c9a958]/10"
                      : "border-white/10 bg-white/5 hover:border-[#c9a958]/30 hover:bg-white/10",
                  )}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-white">{schedule.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatDateTime(new Date(schedule.startAt))} - {formatDateTime(new Date(schedule.endAt))}</p>
                      <p className="mt-2 text-sm text-slate-300">{schedule.description ?? "Sem descrição operacional."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getDutyScheduleStatusVariant(schedule.status)}>{dutyScheduleStatusLabels[schedule.status]}</Badge>
                      <Badge variant="default">{schedule.assignments.length} tripulantes</Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <ScheduleEditor
          key={selectedSchedule?.id ?? "new"}
          selectedSchedule={selectedSchedule}
          crewMembers={crewMembers}
          schedules={schedules}
          onCreateNew={() => {
            setSelectedScheduleId(null);
            setReferenceDate(new Date());
          }}
        />

        {selectedSchedule ? (
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da escala selecionada</CardTitle>
              <CardDescription>Resumo tático da escala atualmente em edição.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{selectedSchedule.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{selectedSchedule.description ?? "Sem descrição operacional."}</p>
                  </div>
                  <Badge variant={getDutyScheduleStatusVariant(selectedSchedule.status)}>{dutyScheduleStatusLabels[selectedSchedule.status]}</Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#c9a958]" />
                    {formatDateTime(new Date(selectedSchedule.startAt))} - {formatDateTime(new Date(selectedSchedule.endAt))}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#c9a958]" />
                    {selectedSchedule.location ?? "Local não definido"}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {selectedSchedule.assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{assignment.userName}</p>
                      <Badge variant="default">{assignment.roleLabel ?? "Sem função"}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{assignment.notes ?? "Sem notas adicionais."}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}