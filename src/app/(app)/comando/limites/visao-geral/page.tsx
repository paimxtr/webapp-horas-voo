import { getLimitsOverviewPageData } from "@/lib/data";
import { requireCommander } from "@/lib/auth";
import { LimitPeriod } from "@prisma/client";
import { formatMinutes, periodLabel } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "VisÃ£o Geral de Limites" };

const levelColors: Record<string, string> = {
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-rose-400",
  exceeded: "text-rose-500",
};

const levelBg: Record<string, string> = {
  green: "bg-emerald-500/20 border-emerald-500/30",
  yellow: "bg-amber-500/20 border-amber-500/30",
  red: "bg-rose-500/20 border-rose-500/30",
  exceeded: "bg-rose-500/30 border-rose-500/50",
};

const periodOrder = [LimitPeriod.DAILY, LimitPeriod.WEEKLY, LimitPeriod.MONTHLY, LimitPeriod.YEARLY];

export default async function LimitsOverviewPage() {
  await requireCommander();
  const { crewMembers } = await getLimitsOverviewPageData();

  return (
    <div className="min-h-screen bg-[#04080f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/comando/limites"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar Ã  configuraÃ§Ã£o de limites
          </Link>
          <h1 className="font-serif text-3xl text-white">VisÃ£o geral de limites</h1>
          <p className="mt-1 text-sm text-slate-400">
            Consumo atual de cada tripulante em todos os perÃ­odos configurados.
          </p>
        </div>

        <div className="space-y-4">
          {crewMembers.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/5 px-6 py-12 text-center text-slate-400">
              Nenhum tripulante encontrado.
            </div>
          )}
          {crewMembers.map((member) => {
            const sorted = [...member.limitStatuses].sort(
              (a, b) => periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period),
            );
            const hasAlert = sorted.some((s) => s.level === "yellow" || s.level === "red" || s.level === "exceeded");

            return (
              <div
                key={member.id}
                className="rounded-2xl border border-white/5 bg-white/5 p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {member.rank && <span className="mr-1.5 text-[#c9a958]">{member.rank}</span>}
                      {member.name}
                    </p>
                    {(member.overrides.length > 0 || member.exemptions.length > 0) && (
                      <p className="mt-0.5 text-xs text-amber-400">
                        {member.overrides.length > 0 && `${member.overrides.length} limite(s) individual(ais)`}
                        {member.overrides.length > 0 && member.exemptions.length > 0 && " Â· "}
                        {member.exemptions.length > 0 && `${member.exemptions.length} isenÃ§Ã£o(Ãµes) ativa(s)`}
                      </p>
                    )}
                  </div>
                  {hasAlert ? (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {sorted.map((status) => (
                    <div
                      key={status.period}
                      className={`rounded-xl border p-3 ${levelBg[status.level]}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          {periodLabel(status.period)}
                        </p>
                        {status.isOverridden && (
                          <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Individual
                          </Badge>
                        )}
                      </div>
                      <p className={`mt-1 text-lg font-bold ${levelColors[status.level]}`}>
                        {formatMinutes(status.consumedMinutes)}
                      </p>
                      <p className="text-xs text-slate-500">de {formatMinutes(status.maxMinutes)}</p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status.level === "green"
                              ? "bg-emerald-400"
                              : status.level === "yellow"
                                ? "bg-amber-400"
                                : "bg-rose-400"
                          }`}
                          style={{ width: `${Math.min(status.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {Math.round(status.percentage)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

