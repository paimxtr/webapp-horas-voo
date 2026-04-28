import Link from "next/link";
import { FileDown, FileText, Printer } from "lucide-react";
import { requireCommander } from "@/lib/auth";
import { getReportsPageData } from "@/lib/data";
import { formatDate, formatMinutes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const flightLogStatusLabels: Record<string, string> = {
  SUBMITTED: "Submetido",
  REJECTED: "Rejeitado",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const resolved = await searchParams;
  const startDate = typeof resolved.inicio === "string" ? resolved.inicio : "";
  const endDate = typeof resolved.fim === "string" ? resolved.fim : "";

  const data = await getReportsPageData({ startDate, endDate });

  const csvBase = `/api/exports/csv?inicio=${encodeURIComponent(startDate)}&fim=${encodeURIComponent(endDate)}`;
  const pdfBase = `/api/exports/pdf?inicio=${encodeURIComponent(startDate)}&fim=${encodeURIComponent(endDate)}`;

  const periodLabel =
    startDate && endDate
      ? `${formatDate(new Date(startDate))} — ${formatDate(new Date(endDate))}`
      : `1 Jan ${data.startDate.getFullYear()} — ${formatDate(data.endDate)}`;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de período</CardTitle>
          <CardDescription>
            Selecione o período para os relatórios de horas. Os estados de limite são calculados sempre em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Data de início</Label>
              <Input id="inicio" name="inicio" type="date" defaultValue={startDate} className="w-44" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fim">Data de fim</Label>
              <Input id="fim" name="fim" type="date" defaultValue={endDate} className="w-44" />
            </div>
            <Button type="submit" variant="outline">
              Aplicar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Hours per crew member */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Horas por tripulante</CardTitle>
            <CardDescription>Horas de voo aprovadas por tripulante · {periodLabel}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`${csvBase}&tipo=horas-tripulante`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                CSV
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`${pdfBase}&tipo=horas-tripulante`} target="_blank">
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.hoursByCrewMember.length === 0 ? (
            <p className="text-sm text-slate-400">Sem dados para o período selecionado.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Tripulante</TH>
                  <TH>Graduação</TH>
                  <TH>Missões</TH>
                  <TH>Total aprovado</TH>
                </TR>
              </THead>
              <TBody>
                {data.hoursByCrewMember.map((item) => (
                  <TR key={item.id}>
                    <TD className="font-semibold text-white">{item.name}</TD>
                    <TD className="text-slate-400">{item.rank ?? "—"}</TD>
                    <TD>{item.logCount}</TD>
                    <TD className="font-semibold text-[#c9a958]">{formatMinutes(item.totalMinutes)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hours per aircraft */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Horas por aeronave</CardTitle>
            <CardDescription>Horas de voo aprovadas por aeronave · {periodLabel}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`${csvBase}&tipo=horas-aeronave`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                CSV
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`${pdfBase}&tipo=horas-aeronave`} target="_blank">
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.hoursByAircraft.length === 0 ? (
            <p className="text-sm text-slate-400">Sem dados para o período selecionado.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Código</TH>
                  <TH>Modelo</TH>
                  <TH>Missões</TH>
                  <TH>Total aprovado</TH>
                </TR>
              </THead>
              <TBody>
                {data.hoursByAircraft.map((item) => (
                  <TR key={item.id}>
                    <TD className="font-semibold text-white">{item.code}</TD>
                    <TD className="text-slate-400">{item.model}</TD>
                    <TD>{item.logCount}</TD>
                    <TD className="font-semibold text-[#c9a958]">{formatMinutes(item.totalMinutes)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hours per mission type */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Horas por tipo de missão</CardTitle>
            <CardDescription>Horas de voo aprovadas por tipo de missão · {periodLabel}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`${csvBase}&tipo=horas-missao`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                CSV
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`${pdfBase}&tipo=horas-missao`} target="_blank">
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.hoursByMissionType.length === 0 ? (
            <p className="text-sm text-slate-400">Sem dados para o período selecionado.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Tipo de missão</TH>
                  <TH>Missões</TH>
                  <TH>Total aprovado</TH>
                </TR>
              </THead>
              <TBody>
                {data.hoursByMissionType.map((item) => (
                  <TR key={item.id}>
                    <TD className="font-semibold text-white">{item.name}</TD>
                    <TD>{item.logCount}</TD>
                    <TD className="font-semibold text-[#c9a958]">{formatMinutes(item.totalMinutes)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Limit status report */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Estado de limites de horas</CardTitle>
            <CardDescription>Consumo atual face aos limites configurados para todos os tripulantes.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`${csvBase}&tipo=limites`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                CSV
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`${pdfBase}&tipo=limites`} target="_blank">
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Tripulante</TH>
                <TH>Graduação</TH>
                <TH>Diário</TH>
                <TH>Semanal</TH>
                <TH>Mensal</TH>
                <TH>Anual</TH>
              </TR>
            </THead>
            <TBody>
              {data.limitStatuses.map((member) => (
                <TR key={member.id}>
                  <TD className="font-semibold text-white">{member.name}</TD>
                  <TD className="text-slate-400">{member.rank ?? "—"}</TD>
                  {member.limitStatuses.map((ls) => (
                    <TD key={ls.id}>
                      <Badge
                        variant={ls.level === "green" ? "success" : ls.level === "yellow" ? "warning" : "danger"}
                      >
                        {Math.round(ls.percentage)}%
                      </Badge>
                      <p className="mt-1 text-xs text-slate-500">{formatMinutes(ls.consumedMinutes)}</p>
                    </TD>
                  ))}
                  {/* Fill empty cells if fewer limits than 4 */}
                  {Array.from({ length: Math.max(0, 4 - member.limitStatuses.length) }).map((_, i) => (
                    <TD key={`empty-${i}`}>
                      <span className="text-slate-600">—</span>
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending/rejected records */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Registos pendentes e rejeitados</CardTitle>
            <CardDescription>
              {data.pendingRejectedLogs.length} registos aguardam aprovação ou foram rejeitados.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`${csvBase}&tipo=pendentes`}>
                <FileDown className="mr-1.5 h-4 w-4" />
                CSV
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`${pdfBase}&tipo=pendentes`} target="_blank">
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.pendingRejectedLogs.length === 0 ? (
            <p className="text-sm text-slate-400">Sem registos pendentes ou rejeitados.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Tripulante</TH>
                  <TH>Data</TH>
                  <TH>Voo</TH>
                  <TH>Duração</TH>
                  <TH>Estado</TH>
                  <TH>Observação</TH>
                </TR>
              </THead>
              <TBody>
                {data.pendingRejectedLogs.map((log) => (
                  <TR key={log.id}>
                    <TD className="font-semibold text-white">{log.crewMember.name}</TD>
                    <TD className="text-slate-400">{formatDate(log.date)}</TD>
                    <TD>
                      <p>
                        {log.origin} → {log.destination}
                      </p>
                      <p className="text-xs text-slate-500">
                        {log.aircraft.code} · {log.missionType.name}
                      </p>
                    </TD>
                    <TD>{formatMinutes(log.durationMinutes)}</TD>
                    <TD>
                      <Badge variant={log.status === "SUBMITTED" ? "warning" : "danger"}>
                        {flightLogStatusLabels[log.status] ?? log.status}
                      </Badge>
                    </TD>
                    <TD className="max-w-xs text-sm text-slate-400">
                      {log.rejectionReason ?? (log.status === "SUBMITTED" ? "Aguarda aprovação" : "—")}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Full export section */}
      <Card>
        <CardHeader>
          <CardTitle>Exportação completa</CardTitle>
          <CardDescription>Exportar relatório completo do período selecionado.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`${csvBase}&tipo=completo`}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar CSV completo
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`${pdfBase}&tipo=completo`} target="_blank">
              <FileText className="mr-2 h-4 w-4" />
              Imprimir relatório completo
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
