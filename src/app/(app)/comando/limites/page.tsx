import Link from "next/link";
import { LimitPeriod } from "@prisma/client";
import {
  deactivateLimitExemptionAction,
  deleteUserHourLimitAction,
  saveHourLimitAction,
  saveLimitExemptionAction,
  saveUserHourLimitAction,
} from "@/actions/commander-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireCommander } from "@/lib/auth";
import { getHourLimitsPageData, getUserLimitOverridesData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";
import { formatDate, formatMinutes, periodLabel } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";

const periodOrder = [LimitPeriod.DAILY, LimitPeriod.WEEKLY, LimitPeriod.MONTHLY, LimitPeriod.YEARLY];

export default async function HourLimitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const [limits, overridesData, feedback] = await Promise.all([
    getHourLimitsPageData(),
    getUserLimitOverridesData(),
    getFeedback(searchParams),
  ]);

  const sortedLimits = [...limits].sort(
    (a, b) => periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period),
  );

  return (
    <div className="space-y-6">
      {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}

      <div className="flex items-center justify-between">
        <div />
        <Link
          href="/comando/limites/visao-geral"
          className="inline-flex items-center gap-2 rounded-xl border border-[#c9a958]/30 bg-[#c9a958]/10 px-4 py-2 text-sm font-semibold text-[#c9a958] transition hover:bg-[#c9a958]/20"
        >
          <LayoutDashboard className="h-4 w-4" />
          VisÃ£o geral por tripulante
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limites globais</CardTitle>
          <CardDescription>ConfiguraÃ§Ã£o dos mÃ¡ximos diÃ¡rios, semanais, mensais e anuais utilizados pelos alertas.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>PerÃ­odo</TH>
                <TH>Limite atual</TH>
                <TH>Novo valor (minutos)</TH>
                <TH>Info</TH>
              </TR>
            </THead>
            <TBody>
              {sortedLimits.map((limit) => (
                <TR key={limit.id}>
                  <TD className="font-semibold text-white">{periodLabel(limit.period)}</TD>
                  <TD>{formatMinutes(limit.maxMinutes)}</TD>
                  <TD>
                    <form action={saveHourLimitAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <input type="hidden" name="period" value={limit.period} />
                      <div className="w-full max-w-xs space-y-2">
                        <Label htmlFor={`limit-${limit.period}`}>Minutos</Label>
                        <Input id={`limit-${limit.period}`} name="maxMinutes" defaultValue={limit.maxMinutes} type="number" min={1} required />
                      </div>
                      <SubmitButton size="sm">Guardar</SubmitButton>
                    </form>
                  </TD>
                  <TD className="text-sm text-slate-500">AtualizaÃ§Ã£o imediata nos painÃ©is.</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limites individuais</CardTitle>
          <CardDescription>
            Defina limites especÃ­ficos por tripulante que substituem o valor global para um determinado perÃ­odo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={saveUserHourLimitAction} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="userId-override">Tripulante</Label>
              <Select id="userId-override" name="userId" required>
                <option value="">Selecionar tripulanteâ€¦</option>
                {overridesData.crewMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.rank ? `${member.rank} Â· ` : ""}{member.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-override">PerÃ­odo</Label>
              <Select id="period-override" name="period" required>
                {periodOrder.map((p) => (
                  <option key={p} value={p}>{periodLabel(p)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMinutes-override">Limite (minutos)</Label>
              <Input id="maxMinutes-override" name="maxMinutes" type="number" min={0} placeholder="ex: 600" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason-override">Motivo (opcional)</Label>
              <Input id="reason-override" name="reason" placeholder="QualificaÃ§Ã£o adicional, habilitaÃ§Ã£o especialâ€¦" />
            </div>
            <div className="flex items-end">
              <SubmitButton>Definir limite individual</SubmitButton>
            </div>
          </form>

          {overridesData.overrides.length > 0 && (
            <Table>
              <THead>
                <TR>
                  <TH>Tripulante</TH>
                  <TH>PerÃ­odo</TH>
                  <TH>Limite</TH>
                  <TH>Motivo</TH>
                  <TH>AÃ§Ã£o</TH>
                </TR>
              </THead>
              <TBody>
                {overridesData.overrides.map((override) => (
                  <TR key={override.id}>
                    <TD className="font-semibold text-white">{override.user.name}</TD>
                    <TD>{periodLabel(override.period)}</TD>
                    <TD>{formatMinutes(override.maxMinutes)}</TD>
                    <TD className="text-slate-400">{override.reason ?? "â€”"}</TD>
                    <TD>
                      <form action={deleteUserHourLimitAction}>
                        <input type="hidden" name="overrideId" value={override.id} />
                        <SubmitButton size="sm" variant="destructive">Remover</SubmitButton>
                      </form>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IsenÃ§Ãµes temporÃ¡rias</CardTitle>
          <CardDescription>
            Autorize um tripulante a exceder os limites por um perÃ­odo definido, com justificaÃ§Ã£o obrigatÃ³ria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={saveLimitExemptionAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="userId-exempt">Tripulante</Label>
              <Select id="userId-exempt" name="userId" required>
                <option value="">Selecionar tripulanteâ€¦</option>
                {overridesData.crewMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.rank ? `${member.rank} Â· ` : ""}{member.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-exempt">PerÃ­odo isento</Label>
              <Select id="period-exempt" name="period" required>
                {periodOrder.map((p) => (
                  <option key={p} value={p}>{periodLabel(p)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validFrom-exempt">VÃ¡lido desde</Label>
              <Input id="validFrom-exempt" name="validFrom" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil-exempt">VÃ¡lido atÃ©</Label>
              <Input id="validUntil-exempt" name="validUntil" type="date" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="justification-exempt">JustificaÃ§Ã£o</Label>
              <Input id="justification-exempt" name="justification" placeholder="Motivo da isenÃ§Ã£o temporÃ¡riaâ€¦" required />
            </div>
            <div>
              <SubmitButton>Criar isenÃ§Ã£o</SubmitButton>
            </div>
          </form>

          {overridesData.exemptions.length > 0 && (
            <Table>
              <THead>
                <TR>
                  <TH>Tripulante</TH>
                  <TH>PerÃ­odo</TH>
                  <TH>Validade</TH>
                  <TH>JustificaÃ§Ã£o</TH>
                  <TH>Concedido por</TH>
                  <TH>Estado</TH>
                  <TH>AÃ§Ã£o</TH>
                </TR>
              </THead>
              <TBody>
                {overridesData.exemptions.map((exemption) => (
                  <TR key={exemption.id}>
                    <TD className="font-semibold text-white">{exemption.user.name}</TD>
                    <TD>{periodLabel(exemption.period)}</TD>
                    <TD className="text-sm">
                      {formatDate(exemption.validFrom)} â†’ {formatDate(exemption.validUntil)}
                    </TD>
                    <TD className="text-slate-400 max-w-[200px] truncate">{exemption.justification}</TD>
                    <TD className="text-slate-400">{exemption.grantedBy.name}</TD>
                    <TD>
                      <Badge variant={exemption.active && new Date() <= exemption.validUntil ? "success" : "muted"}>
                        {exemption.active && new Date() <= exemption.validUntil ? "Ativa" : "Expirada"}
                      </Badge>
                    </TD>
                    <TD>
                      {exemption.active && (
                        <form action={deactivateLimitExemptionAction}>
                          <input type="hidden" name="exemptionId" value={exemption.id} />
                          <SubmitButton size="sm" variant="destructive">Revogar</SubmitButton>
                        </form>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

