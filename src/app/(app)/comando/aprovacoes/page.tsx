import { FlightLogStatus } from "@prisma/client";
import { FileDown, Paperclip } from "lucide-react";
import { approveFlightLogAction, batchApproveFlightLogsAction, rejectFlightLogAction } from "@/actions/commander-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireCommander } from "@/lib/auth";
import { getApprovalsPageData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";
import { formatBytes, formatDate, formatMinutes } from "@/lib/utils";

const statusLabels: Record<FlightLogStatus, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Submetido",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const resolvedSearch = await searchParams;
  const status = typeof resolvedSearch.status === "string" ? resolvedSearch.status : "ALL";
  const crewMemberId = typeof resolvedSearch.crew === "string" ? resolvedSearch.crew : "";

  const [data, feedback] = await Promise.all([
    getApprovalsPageData({ status, crewMemberId }),
    getFeedback(Promise.resolve(resolvedSearch)),
  ]);

  return (
    <div className="space-y-6">
      {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Filtros e aprovação em lote</CardTitle>
          <CardDescription>Filtrar pendências e validar vários registos simultaneamente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <form className="grid gap-4 md:grid-cols-2" method="GET">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="ALL">Todos</option>
                <option value={FlightLogStatus.SUBMITTED}>Submetidos</option>
                <option value={FlightLogStatus.APPROVED}>Aprovados</option>
                <option value={FlightLogStatus.REJECTED}>Rejeitados</option>
                <option value={FlightLogStatus.DRAFT}>Rascunhos</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crew">Tripulante</Label>
              <Select id="crew" name="crew" defaultValue={crewMemberId}>
                <option value="">Todos</option>
                {data.crewMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <SubmitButton type="submit">Aplicar filtros</SubmitButton>
            </div>
          </form>

          <form action={batchApproveFlightLogsAction} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">Aprovação rápida</p>
            {data.logs
              .filter((log) => log.status === FlightLogStatus.SUBMITTED)
              .slice(0, 5)
              .map((log) => (
                <label key={log.id} className="mt-3 flex items-center gap-2 text-sm text-slate-200">
                  <input name="flightLogIds" type="checkbox" value={log.id} className="h-4 w-4 accent-[#c9a958]" />
                  {log.crewMember.name} · {formatDate(log.date)}
                </label>
              ))}
            <div className="mt-4">
              <SubmitButton size="sm">Aprovar selecionados</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Fila de validação</CardTitle>
            <CardDescription>{data.logs.length} registos localizados segundo os filtros aplicados.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/exports/csv?tipo=pendentes`}>
              <FileDown className="mr-1.5 h-4 w-4" />
              Exportar lista
            </a>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Tripulante</TH>
                <TH>Voo</TH>
                <TH>Estado</TH>
                <TH>Observações</TH>
                <TH>Ações</TH>
              </TR>
            </THead>
            <TBody>
              {data.logs.map((log) => (
                <TR key={log.id}>
                  <TD>
                    <p className="font-semibold text-white">{log.crewMember.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(log.date)}</p>
                  </TD>
                  <TD>
                    <p>{log.origin} → {log.destination}</p>
                    <p className="text-xs text-slate-500">
                      {log.aircraft.code} · {log.missionType.name} · {formatMinutes(log.durationMinutes)}
                    </p>
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        log.status === FlightLogStatus.APPROVED
                          ? "success"
                          : log.status === FlightLogStatus.SUBMITTED
                            ? "warning"
                            : log.status === FlightLogStatus.REJECTED
                              ? "danger"
                              : "muted"
                      }
                    >
                      {statusLabels[log.status]}
                    </Badge>
                    {log.crewCrossCheck.hasDiscrepancy ? (
                      <div className="mt-2">
                        <Badge variant="danger">Falta confirmação cruzada</Badge>
                      </div>
                    ) : log.otherCrewMembers.length > 0 ? (
                      <div className="mt-2">
                        <Badge variant="success">Confirmação cruzada OK</Badge>
                      </div>
                    ) : null}
                  </TD>
                  <TD className="max-w-sm">
                    <p className="text-sm text-slate-300">{log.notes ?? "Sem notas."}</p>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tripulação do voo</p>
                      {log.otherCrewMembers.length === 0 ? (
                        <p className="text-xs text-slate-500">Sem tripulação adicional indicada.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {log.otherCrewMembers.map((member) => {
                            const isMissing = log.crewCrossCheck.missingCrewMembers.some((item) => item.id === member.id);

                            return (
                              <Badge key={member.id} variant={isMissing ? "danger" : "default"}>
                                {member.rank ? `${member.rank} · ${member.name}` : member.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      {log.crewCrossCheck.missingCrewMembers.length > 0 ? (
                        <p className="text-xs text-rose-300">
                          Sem registo correspondente submetido/aprovado para:{" "}
                          {log.crewCrossCheck.missingCrewMembers.map((member) => member.name).join(", ")}.
                        </p>
                      ) : null}
                    </div>
                    {log.rejectionReason ? <p className="mt-2 text-xs text-rose-300">Rejeição: {log.rejectionReason}</p> : null}
                    {log.attachments.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Anexos</p>
                        {log.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/uploads/${attachment.filename}`}
                            download={attachment.originalName}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                          >
                            <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{attachment.originalName}</span>
                            <span className="shrink-0 text-slate-500">({formatBytes(attachment.sizeBytes)})</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </TD>
                  <TD>
                    {log.status === FlightLogStatus.SUBMITTED ? (
                      <div className="space-y-2">
                        <form action={approveFlightLogAction}>
                          <input type="hidden" name="flightLogId" value={log.id} />
                          <SubmitButton size="sm">Aprovar</SubmitButton>
                        </form>
                        <form action={rejectFlightLogAction} className="space-y-2">
                          <input type="hidden" name="flightLogId" value={log.id} />
                          <Input name="rejectionReason" placeholder="Razão da rejeição" required />
                          <SubmitButton size="sm" variant="destructive">Rejeitar</SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Sem ações pendentes</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}