import { saveMissionTypeAction } from "@/actions/commander-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireCommander } from "@/lib/auth";
import { getMissionTypesPageData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";

export default async function MissionTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const [missionTypes, feedback] = await Promise.all([getMissionTypesPageData(), getFeedback(searchParams)]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de missão</CardTitle>
          <CardDescription>Configuração das tipologias operacionais autorizadas pela esquadra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}
          <form action={saveMissionTypeAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Patrulha Marítima" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Descrição operacional da missão" />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input name="active" type="checkbox" className="h-4 w-4 accent-[#c9a958]" defaultChecked />
              Tipo de missão ativo
            </label>
            <SubmitButton>Guardar missão</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo operacional</CardTitle>
          <CardDescription>Tipos de missão disponíveis para registo e aprovação.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Missão</TH>
                <TH>Descrição</TH>
                <TH>Estado</TH>
                <TH>Atualização</TH>
              </TR>
            </THead>
            <TBody>
              {missionTypes.map((item) => (
                <TR key={item.id}>
                  <TD className="font-semibold text-white">{item.name}</TD>
                  <TD>{item.description ?? "—"}</TD>
                  <TD>
                    <Badge variant={item.active ? "success" : "danger"}>{item.active ? "Ativa" : "Inativa"}</Badge>
                  </TD>
                  <TD>
                    <form action={saveMissionTypeAction} className="grid gap-2 lg:grid-cols-2">
                      <input type="hidden" name="id" value={item.id} />
                      <Input name="name" defaultValue={item.name} />
                      <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs">
                        <input name="active" type="checkbox" defaultChecked={item.active} className="h-4 w-4 accent-[#c9a958]" />
                        Ativa
                      </label>
                      <Textarea name="description" defaultValue={item.description ?? ""} className="lg:col-span-2" />
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