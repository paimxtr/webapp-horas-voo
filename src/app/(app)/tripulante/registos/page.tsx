import Link from "next/link";
import { FileDown } from "lucide-react";
import { createFlightLogAction, submitFlightLogAction } from "@/actions/crew-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireCrewMember } from "@/lib/auth";
import { getCrewLogsPageData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";
import { formatDate, formatMinutes } from "@/lib/utils";

export default async function CrewLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCrewMember();
  const [data, feedback] = await Promise.all([getCrewLogsPageData(user.id), getFeedback(searchParams)]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Novo registo de voo</CardTitle>
          <CardDescription>Introduza os dados da missão e guarde como rascunho antes da submissão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}
          <form action={createFlightLogAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aircraftId">Aeronave</Label>
              <Select id="aircraftId" name="aircraftId" required>
                <option value="">Selecionar</option>
                {data.aircraft.map((item) => (
                  <option key={item.id} value={item.id}>{item.code} · {item.model}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="missionTypeId">Tipo de missão</Label>
              <Select id="missionTypeId" name="missionTypeId" required>
                <option value="">Selecionar</option>
                {data.missionTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dutyRole">Função a bordo</Label>
              <Input id="dutyRole" name="dutyRole" placeholder="Piloto, Copiloto, Mestre de Carga..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origem</Label>
              <Input id="origin" name="origin" placeholder="Luanda" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input id="destination" name="destination" placeholder="Cabinda" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureTime">Hora de partida</Label>
              <Input id="departureTime" name="departureTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Hora de chegada</Label>
              <Input id="arrivalTime" name="arrivalTime" type="time" required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Detalhes da missão, observações ou ocorrências." />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-1">
                <Label>Tripulação do voo</Label>
                <p className="text-sm text-slate-400">Com quem voou neste registo. Selecione outros tripulantes da missão.</p>
              </div>
              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
                {data.crewMembers.length === 0 ? (
                  <p className="text-sm text-slate-400">Não existem outros tripulantes ativos disponíveis.</p>
                ) : (
                  data.crewMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-3 text-sm text-slate-200">
                      <input
                        className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-[#c9a958]"
                        type="checkbox"
                        name="otherCrewMemberIds"
                        value={member.id}
                      />
                      <span>{member.rank ? `${member.rank} · ${member.name}` : member.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <SubmitButton>Guardar rascunho</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Histórico pessoal</CardTitle>
            <CardDescription>Gerir rascunhos e consultar o estado dos registos anteriores.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href="/api/exports/csv?tipo=pendentes">
              <FileDown className="mr-1.5 h-4 w-4" />
              Exportar CSV
            </a>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Data</TH>
                <TH>Missão</TH>
                <TH>Duração</TH>
                <TH>Estado</TH>
                <TH>Ações</TH>
              </TR>
            </THead>
            <TBody>
              {data.logs.map((log) => (
                <TR key={log.id}>
                  <TD>{formatDate(log.date)}</TD>
                  <TD>
                    <p className="font-semibold text-white">{log.origin} → {log.destination}</p>
                    <p className="text-xs text-slate-500">{log.aircraft.code} · {log.missionType.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {log.otherCrewMembers.length > 0
                        ? `Tripulação: ${log.otherCrewMembers.map((member) => member.name).join(", ")}`
                        : "Tripulação adicional não indicada"}
                    </p>
                  </TD>
                  <TD>{formatMinutes(log.durationMinutes)}</TD>
                  <TD>
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
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/tripulante/registos/${log.id}`}>Abrir</Link>
                      </Button>
                      {(log.status === "DRAFT" || log.status === "REJECTED") ? (
                        <form action={submitFlightLogAction}>
                          <input type="hidden" name="flightLogId" value={log.id} />
                          <SubmitButton size="sm">Submeter</SubmitButton>
                        </form>
                      ) : null}
                    </div>
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