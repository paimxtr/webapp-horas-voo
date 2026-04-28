import { saveAircraftAction } from "@/actions/commander-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireCommander } from "@/lib/auth";
import { getAircraftPageData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";

export default async function AircraftPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const [aircraft, feedback] = await Promise.all([getAircraftPageData(), getFeedback(searchParams)]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de aeronaves</CardTitle>
          <CardDescription>Manter a frota operacional disponível para registos de voo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}
          <form action={saveAircraftAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" placeholder="C-295" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" name="model" placeholder="Airbus C-295M" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tailNumber">Número de cauda</Label>
              <Input id="tailNumber" name="tailNumber" placeholder="T-271" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Observações operacionais" />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input name="active" type="checkbox" className="h-4 w-4 accent-[#c9a958]" defaultChecked />
              Aeronave ativa
            </label>
            <SubmitButton>Guardar aeronave</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frota registada</CardTitle>
          <CardDescription>Aeronaves ativas e históricas disponíveis no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Código</TH>
                <TH>Modelo</TH>
                <TH>Nº cauda</TH>
                <TH>Estado</TH>
                <TH>Atualização</TH>
              </TR>
            </THead>
            <TBody>
              {aircraft.map((item) => (
                <TR key={item.id}>
                  <TD>{item.code}</TD>
                  <TD>{item.model}</TD>
                  <TD>{item.tailNumber ?? "—"}</TD>
                  <TD>
                    <Badge variant={item.active ? "success" : "danger"}>{item.active ? "Ativa" : "Inativa"}</Badge>
                  </TD>
                  <TD>
                    <form action={saveAircraftAction} className="grid gap-2 lg:grid-cols-2">
                      <input type="hidden" name="id" value={item.id} />
                      <Input name="code" defaultValue={item.code} />
                      <Input name="model" defaultValue={item.model} />
                      <Input name="tailNumber" defaultValue={item.tailNumber ?? ""} />
                      <Textarea name="notes" defaultValue={item.notes ?? ""} className="lg:col-span-2" />
                      <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs">
                        <input name="active" type="checkbox" defaultChecked={item.active} className="h-4 w-4 accent-[#c9a958]" />
                        Ativa
                      </label>
                      <div className="lg:col-span-2">
                        <SubmitButton size="sm">Atualizar</SubmitButton>
                      </div>
                    </form>
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