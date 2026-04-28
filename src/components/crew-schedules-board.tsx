"use client";

import { addMonths, addWeeks, format, isSameDay, isSameMonth, isToday, subMonths, subWeeks } from "date-fns";
import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCalendarDays, dutyScheduleStatusLabels, getDutyScheduleStatusVariant } from "@/lib/schedules";
import { cn, formatDateTime, formatTime } from "@/lib/utils";

type CrewAssignmentRecord = {
  id: string;
  roleLabel: string | null;
  notes: string | null;
  schedule: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startAt: string;
    endAt: string;
    status: "DRAFT" | "PUBLISHED" | "CHANGED" | "CANCELLED";
    assignments: {
      id: string;
      user: {
        id: string;
        name: string;
      };
      roleLabel: string | null;
    }[];
  };
};

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getWindowLabel(referenceDate: Date, view: "month" | "week") {
  if (view === "week") {
    const days = buildCalendarDays(referenceDate, "week");
    return `${format(days[0], "dd/MM")} - ${format(days[days.length - 1], "dd/MM/yyyy")}`;
  }

  return format(referenceDate, "MMMM yyyy");
}

export function CrewSchedulesBoard({ assignments }: { assignments: CrewAssignmentRecord[] }) {
  const [view, setView] = useState<"month" | "week">("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(assignments[0]?.id ?? null);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0] ?? null,
    [assignments, selectedAssignmentId],
  );

  const calendarDays = useMemo(() => buildCalendarDays(referenceDate, view), [referenceDate, view]);
  const upcomingAssignments = useMemo(
    () => [...assignments].sort((left, right) => new Date(left.schedule.startAt).getTime() - new Date(right.schedule.startAt).getTime()),
    [assignments],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Calendário pessoal de escalas</CardTitle>
              <CardDescription>Visão consolidada das suas prontidões e serviços atribuídos.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
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
                <span className="font-semibold capitalize">{getWindowLabel(referenceDate, view)}</span>
              </div>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{assignments.length} atribuições</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((label) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs uppercase tracking-[0.24em] text-slate-400">
                  {label}
                </div>
              ))}
              {calendarDays.map((day) => {
                const dayAssignments = assignments.filter((assignment) => isSameDay(new Date(assignment.schedule.startAt), day));

                return (
                  <div key={day.toISOString()} className={cn("min-h-32 rounded-2xl border border-white/10 bg-white/5 p-3", view === "month" && !isSameMonth(day, referenceDate) ? "opacity-45" : "")}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", isToday(day) ? "text-[#f6e7c1]" : "text-white")}>{format(day, "dd")}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{dayAssignments.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {dayAssignments.slice(0, view === "month" ? 3 : 6).map((assignment) => (
                        <button key={assignment.id} type="button" onClick={() => setSelectedAssignmentId(assignment.id)} className={cn("w-full rounded-xl border px-2 py-2 text-left text-xs transition", selectedAssignmentId === assignment.id ? "border-[#c9a958]/50 bg-[#c9a958]/10" : "border-white/10 bg-black/20 hover:border-[#c9a958]/30 hover:bg-white/10")}>
                          <p className="truncate font-semibold text-white">{assignment.schedule.title}</p>
                          <p className="mt-1 text-slate-400">{formatTime(new Date(assignment.schedule.startAt))}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas atribuições</CardTitle>
            <CardDescription>Lista cronológica das suas escalas futuras e em curso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-slate-400">Sem escalas atribuídas.</p>
            ) : (
              upcomingAssignments.map((assignment) => (
                <button key={assignment.id} type="button" onClick={() => setSelectedAssignmentId(assignment.id)} className={cn("w-full rounded-2xl border p-4 text-left transition", selectedAssignmentId === assignment.id ? "border-[#c9a958]/50 bg-[#c9a958]/10" : "border-white/10 bg-white/5 hover:border-[#c9a958]/30 hover:bg-white/10")}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-white">{assignment.schedule.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{formatDateTime(new Date(assignment.schedule.startAt))} - {formatDateTime(new Date(assignment.schedule.endAt))}</p>
                      <p className="mt-2 text-sm text-slate-300">{assignment.roleLabel ?? "Função por definir"}</p>
                    </div>
                    <Badge variant={getDutyScheduleStatusVariant(assignment.schedule.status)}>{dutyScheduleStatusLabels[assignment.schedule.status]}</Badge>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da escala</CardTitle>
          <CardDescription>Informação detalhada da sua próxima ou atual escala selecionada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedAssignment ? (
            <p className="text-sm text-slate-400">Selecione uma escala no calendário para ver os detalhes.</p>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{selectedAssignment.schedule.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{selectedAssignment.schedule.description ?? "Sem descrição operacional."}</p>
                  </div>
                  <Badge variant={getDutyScheduleStatusVariant(selectedAssignment.schedule.status)}>{dutyScheduleStatusLabels[selectedAssignment.schedule.status]}</Badge>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#c9a958]" />
                    {formatDateTime(new Date(selectedAssignment.schedule.startAt))} - {formatDateTime(new Date(selectedAssignment.schedule.endAt))}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#c9a958]" />
                    {selectedAssignment.schedule.location ?? "Local não definido"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#c9a958]" />
                    {selectedAssignment.roleLabel ?? "Função por definir"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Notas</p>
                <p className="mt-3 text-sm text-slate-300">{selectedAssignment.notes ?? "Sem observações complementares."}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Equipa atribuída</p>
                <div className="mt-4 space-y-3">
                  {selectedAssignment.schedule.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                      <span className="font-semibold text-white">{assignment.user.name}</span>
                      <Badge variant={assignment.roleLabel === selectedAssignment.roleLabel ? "warning" : "default"}>{assignment.roleLabel ?? "Sem função"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
