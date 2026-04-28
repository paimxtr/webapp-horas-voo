import Link from "next/link";
import { notFound } from "next/navigation";
import { submitFlightLogAction, updateFlightLogAction } from "@/actions/crew-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requireCrewMember } from "@/lib/auth";
import { getFlightLogForEdit, getFlightLogHistory } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";
import { formatDate, formatDateTime, formatMinutes, formatTime } from "@/lib/utils";
import { History, Paperclip } from "lucide-react";

const actionLabels: Record<string, string> = {
  FLIGHT_LOG_CREATED: "Registo criado",
  FLIGHT_LOG_UPDATED: "Registo editado",
  FLIGHT_LOG_SUBMITTED: "Submetido para aprovação",
  FLIGHT_LOG_APPROVED: "Aprovado",
  FLIGHT_LOG_REJECTED: "Rejeitado",
  ATTACHMENT_DELETED: "Anexo removido",
};

export default async function FlightLogDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCrewMember();
  const { id } = await params;

  const [{ flightLog, aircraft, missionTypes, crewMembers }, history, feedback] = await Promise.all([
    getFlightLogForEdit(user.id, id),
    getFlightLogHistory(id),
    getFeedback(searchParams),
  ]);

  if (!flightLog) {
    notFound();
  }

  const editable = flightLog.status === "DRAFT" || flightLog.status === "REJECTED";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Detalhe do registo</CardTitle>
          <CardDescription>Atualize o rascunho ou consulte o parecer do comandante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}

          <div className="flex flex-wrap gap-3">
            <Badge
              variant={
                flightLog.status === "APPROVED"
                  ? "success"
                  : flightLog.status === "SUBMITTED"
                    ? "warning"
                    : flightLog.status === "REJECTED"
                      ? "danger"
                      : "muted"
              }
            >
              {flightLog.status}
            </Badge>
            <Badge variant="default">{formatMinutes(flightLog.durationMinutes)}</Badge>
          </div>

          <form action={updateFlightLogAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={flightLog.id} />

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" defaultValue={flightLog.date.toISOString().slice(0, 10)} disabled={!editable} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraftId">Aeronave</Label>
              <Select id="aircraftId" name="aircraftId" defaultValue={flightLog.aircraftId} disabled={!editable}>
                {aircraft.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.model}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="missionTypeId">Tipo de missão</Label>
              <Select id="missionTypeId" name="missionTypeId" defaultValue={flightLog.missionTypeId} disabled={!editable}>
                {missionTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dutyRole">Função a bordo</Label>
              <Input id="dutyRole" name="dutyRole" defaultValue={flightLog.dutyRole} disabled={!editable} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origem</Label>
              <Input id="origin" name="origin" defaultValue={flightLog.origin} disabled={!editable} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input id="destination" name="destination" defaultValue={flightLog.destination} disabled={!editable} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departureTime">Partida</Label>
              <Input id="departureTime" name="departureTime" type="time" defaultValue={formatTime(flightLog.departureTime)} disabled={!editable} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Chegada</Label>
              <Input id="arrivalTime" name="arrivalTime" type="time" defaultValue={formatTime(flightLog.arrivalTime)} disabled={!editable} required />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" defaultValue={flightLog.notes ?? ""} disabled={!editable} />
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="space-y-1">
                <Label>Tripulação do voo</Label>
                <p className="text-sm text-slate-400">Indique os outros tripulantes que voaram consigo nesta missão.</p>
              </div>
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
                {crewMembers.length === 0 ? (
                  <p className="text-sm text-slate-400">Não existem outros tripulantes ativos disponíveis.</p>
                ) : (
                  crewMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-3 text-sm text-slate-200">
                      <input
                        className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-[#c9a958]"
                        type="checkbox"
                        name="otherCrewMemberIds"
                        value={member.id}
                        defaultChecked={flightLog.otherCrewMembers.some((crewMember) => crewMember.id === member.id)}
                        disabled={!editable}
                      />
                      <span>{member.rank ? `${member.rank} · ${member.name}` : member.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              {editable ? <SubmitButton>Guardar alterações</SubmitButton> : null}
              <Button asChild variant="ghost">
                <Link href="/tripulante/registos">Voltar à lista</Link>
              </Button>
            </div>
          </form>

          {(flightLog.status === "DRAFT" || flightLog.status === "REJECTED") ? (
            <form action={submitFlightLogAction}>
              <input type="hidden" name="flightLogId" value={flightLog.id} />
              <SubmitButton type="submit" variant="secondary">Submeter para aprovação</SubmitButton>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
            <CardDescription>Informação consolidada para consulta rápida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Missão</p>
              <p className="mt-2 font-semibold text-white">{flightLog.missionType.name}</p>
              <p className="text-sm text-slate-400">
                {flightLog.aircraft.code} · {formatDate(flightLog.date)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Janela de voo</p>
              <p className="mt-2 text-white">
                {formatDateTime(flightLog.departureTime)} — {formatDateTime(flightLog.arrivalTime)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {flightLog.origin} → {flightLog.destination}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tripulação do voo</p>
              {flightLog.otherCrewMembers.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">Nenhum outro tripulante foi associado a este registo.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {flightLog.otherCrewMembers.map((member) => (
                    <Badge key={member.id} variant="default">
                      {member.rank ? `${member.rank} · ${member.name}` : member.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {flightLog.rejectionReason ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-rose-300">Motivo da rejeição</p>
                <p className="mt-2 text-sm text-rose-100">{flightLog.rejectionReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Tabs defaultValue="attachments">
          <TabsList>
            <TabsTrigger value="attachments">
              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
              Anexos ({flightLog.attachments.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-1.5 h-3.5 w-3.5" />
              Histórico ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attachments">
            <AttachmentsPanel
              flightLogId={flightLog.id}
              attachments={flightLog.attachments.map((a) => ({
                id: a.id,
                filename: a.filename,
                originalName: a.originalName,
                mimeType: a.mimeType,
                sizeBytes: a.sizeBytes,
                createdAt: a.createdAt.toISOString(),
              }))}
              canUpload={flightLog.status === "DRAFT" || flightLog.status === "REJECTED"}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="pt-4">
                {history.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">Nenhum historial disponível.</p>
                ) : (
                  <ol className="relative border-l border-white/10">
                    {history.map((entry) => {
                      let details: Record<string, unknown> = {};
                      try {
                        details = entry.details ? JSON.parse(entry.details) : {};
                      } catch {
                        details = {};
                      }
                      const before = details.before as Record<string, unknown> | undefined;
                      const after = details.after as Record<string, unknown> | undefined;

                      return (
                        <li key={entry.id} className="mb-6 ml-4">
                          <div className="absolute -left-1.5 h-3 w-3 rounded-full border border-[#c9a958]/40 bg-[#c9a958]/20" />
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {actionLabels[entry.action] ?? entry.action}
                            </p>
                            <span className="text-xs text-slate-500">·</span>
                            <p className="text-xs text-slate-400">
                              {formatDateTime(entry.createdAt)}
                            </p>
                          </div>
                          {entry.actor && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              por {entry.actor.rank ? `${entry.actor.rank} ` : ""}{entry.actor.name}
                            </p>
                          )}
                          {(before ?? after) && (
                            <div className="mt-2 space-y-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                              {before && Object.keys(before).length > 0 && (
                                <div>
                                  <span className="text-rose-400">Antes: </span>
                                  <span className="text-slate-300">{JSON.stringify(before)}</span>
                                </div>
                              )}
                              {after && Object.keys(after).length > 0 && (
                                <div>
                                  <span className="text-emerald-400">Depois: </span>
                                  <span className="text-slate-300">{JSON.stringify(after)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
