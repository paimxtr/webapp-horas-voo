import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, FileDown, Users } from "lucide-react";
import Link from "next/link";
import { getCommanderDashboardData } from "@/lib/data";
import { formatDateTime, formatHours, formatMinutes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoursBarChart } from "@/components/hours-bar-chart";
import { requireCommander } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { dutyScheduleStatusLabels, getDutyScheduleStatusVariant } from "@/lib/schedules";

export default async function CommanderDashboardPage() {
  await requireCommander();
  const data = await getCommanderDashboardData();
  const discrepancyCount = data.recentLogs.filter((log) => log.crewCrossCheck.hasDiscrepancy).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/api/exports/csv?tipo=horas-tripulante">
              <FileDown className="mr-1.5 h-4 w-4" />
              Exportar resumo
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/comando/relatorios">Ver relatórios →</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Horas aprovadas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatHours(data.totalApprovedMinutes)}h</p>
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
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Em alerta</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.crewAtWarning}</p>
            </div>
            <Users className="h-9 w-9 text-[#c9a958]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Críticos</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.crewAtCritical}</p>
            </div>
            <AlertTriangle className="h-9 w-9 text-rose-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Divergências</p>
              <p className="mt-2 text-3xl font-semibold text-white">{discrepancyCount}</p>
            </div>
            <AlertTriangle className="h-9 w-9 text-amber-400" />
          </CardContent>
        </Card>
        <Link href="/comando/escalas" className="block">
          <Card className="h-full transition hover:border-[#c9a958]/40">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Escalas futuras</p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.upcomingSchedules.length}</p>
              </div>
              <CalendarDays className="h-9 w-9 text-sky-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Horas por tripulante</CardTitle>
            <CardDescription>Distribuição acumulada de horas aprovadas por membro da esquadra.</CardDescription>
          </CardHeader>
          <CardContent>
            <HoursBarChart
              data={data.crewHours.map((member) => ({
                name: member.name.split(" ")[1] ?? member.name,
                hours: Number(formatHours(member.approvedMinutes)),
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas recentes</CardTitle>
            <CardDescription>Situações operacionais e notificações mais recentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.notifications.length === 0 ? (
              <p className="text-sm text-slate-400">Sem notificações recentes.</p>
            ) : (
              data.notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{notification.title}</p>
                    <span className="text-xs text-slate-500">{formatDateTime(notification.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{notification.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tripulantes com estado de limite</CardTitle>
            <CardDescription>Controlo visual do consumo face aos limites diários, semanais, mensais e anuais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.crewHours.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-sm text-slate-400">{formatMinutes(member.approvedMinutes)} aprovados</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.limitStatuses.map((status) => (
                      <Badge
                        key={status.id}
                        variant={
                          status.level === "green"
                            ? "success"
                            : status.level === "yellow"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {status.period}: {Math.round(status.percentage)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Últimos registos de voo submetidos ou concluídos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{log.crewMember.name}</p>
                    <p className="text-sm text-slate-400">
                      {log.aircraft.code} · {log.missionType.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {log.origin} → {log.destination} · {formatMinutes(log.durationMinutes)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      log.status === "APPROVED"
                        ? "success"
                        : log.status === "SUBMITTED"
                          ? "warning"
                          : log.status === "REJECTED"
                            ? "danger"
                            : "muted"
                    }
                  >
                    {log.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {log.otherCrewMembers.length > 0 ? (
                    log.otherCrewMembers.map((member) => {
                      const isMissing = log.crewCrossCheck.missingCrewMembers.some((item) => item.id === member.id);

                      return (
                        <Badge key={member.id} variant={isMissing ? "danger" : "default"}>
                          {member.name}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-500">Sem tripulação adicional indicada</span>
                  )}
                </div>
                {log.crewCrossCheck.hasDiscrepancy ? (
                  <p className="mt-2 text-xs text-rose-300">
                    Divergência detetada para {log.crewCrossCheck.missingCrewMembers.map((member) => member.name).join(", ")}.
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Próximas escalas</CardTitle>
            <CardDescription>Escalas futuras configuradas e não canceladas.</CardDescription>
          </div>
          <Link
            href="/comando/escalas"
            className="text-sm font-semibold text-[#c9a958] transition hover:text-[#f6e7c1]"
          >
            Ver todas →
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.upcomingSchedules.length === 0 ? (
            <p className="text-sm text-slate-400">Sem escalas futuras configuradas.</p>
          ) : (
            data.upcomingSchedules.map((schedule) => (
              <div key={schedule.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{schedule.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDateTime(schedule.startAt)} — {formatDateTime(schedule.endAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getDutyScheduleStatusVariant(schedule.status)}>
                      {dutyScheduleStatusLabels[schedule.status]}
                    </Badge>
                    <Badge variant="default">{schedule.assignments.length} tripulantes</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}