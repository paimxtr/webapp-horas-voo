import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCrewMember } from "@/lib/auth";
import { getCrewDashboardData } from "@/lib/data";
import { formatDate, formatDateTime, formatHours, formatMinutes } from "@/lib/utils";

const periodLabels = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

export default async function CrewDashboardPage() {
  const user = await requireCrewMember();
  const data = await getCrewDashboardData(user.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Horas aprovadas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatHours(data.approvedMinutes)}h</p>
            </div>
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Pendentes</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.pendingCount}</p>
            </div>
            <Clock3 className="h-9 w-9 text-amber-300" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Em vigilância</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.limitStatuses.filter((item) => item.level === "yellow").length}</p>
            </div>
            <AlertTriangle className="h-9 w-9 text-[#c9a958]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Críticos</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.limitStatuses.filter((item) => item.level === "red" || item.level === "exceeded").length}</p>
            </div>
            <ShieldAlert className="h-9 w-9 text-rose-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Próxima escala</p>
              <p className="mt-2 text-lg leading-tight font-semibold text-white">{data.nextSchedule ? formatDate(data.nextSchedule.schedule.startAt) : "—"}</p>
            </div>
            <CalendarDays className="h-9 w-9 text-sky-400" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Estado dos limites</CardTitle>
            <CardDescription>Leitura consolidada do consumo autorizado por período.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.limitStatuses.map((status) => (
              <div key={status.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{periodLabels[status.period]}</p>
                    <p className="text-sm text-slate-400">{formatMinutes(status.consumedMinutes)} consumidos de {formatMinutes(status.maxMinutes)}</p>
                  </div>
                  <Badge variant={status.level === "green" ? "success" : status.level === "yellow" ? "warning" : "danger"}>
                    {Math.round(status.percentage)}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas escalas</CardTitle>
            <CardDescription>Escalas e prontidões atribuídas ao seu utilizador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.schedules.length === 0 ? (
              <p className="text-sm text-slate-400">Sem escalas futuras registadas.</p>
            ) : (
              data.schedules.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{assignment.schedule.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{assignment.roleLabel ?? "Função não definida"}</p>
                  <p className="mt-2 text-sm text-slate-300">{formatDateTime(assignment.schedule.startAt)} — {formatDateTime(assignment.schedule.endAt)}</p>
                  <p className="mt-1 text-xs text-slate-500">{assignment.schedule.location ?? "Local não definido"}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de submissões</CardTitle>
            <CardDescription>Últimos registos efetuados e respetivo estado de processamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{formatDate(log.date)} · {log.origin} → {log.destination}</p>
                    <p className="text-sm text-slate-400">{log.aircraft.code} · {log.missionType.name} · {formatMinutes(log.durationMinutes)}</p>
                  </div>
                  <Badge variant={log.status === "APPROVED" ? "success" : log.status === "SUBMITTED" ? "warning" : log.status === "REJECTED" ? "danger" : "muted"}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Alertas e comunicações operacionais recentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.notifications.length === 0 ? (
              <p className="text-sm text-slate-400">Sem notificações novas.</p>
            ) : (
              data.notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{notification.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{notification.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
