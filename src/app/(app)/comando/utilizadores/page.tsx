import { Role } from "@prisma/client";
import { saveUserAction, toggleUserStatusAction } from "@/actions/commander-actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { ConfirmDialog } from "@/components/confirmation-dialog";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getUsersPageData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";
import { requireCommander } from "@/lib/auth";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const [users, feedback] = await Promise.all([getUsersPageData(), getFeedback(searchParams)]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de utilizadores</CardTitle>
          <CardDescription>Criar, editar, ativar e desativar os membros da esquadra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}
          <form action={saveUserAction} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="username">Utilizador</Label>
              <Input id="username" name="username" placeholder="novo.utilizador" required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" name="name" placeholder="Nome militar" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">Posto</Label>
              <Input id="rank" name="rank" placeholder="TEN" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select id="role" name="role" defaultValue={Role.CREW_MEMBER}>
                <option value={Role.COMMANDER}>Comandante</option>
                <option value={Role.CREW_MEMBER}>Tripulante</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input name="active" type="checkbox" className="h-4 w-4 accent-[#c9a958]" defaultChecked />
              Utilizador ativo
            </label>
            <div className="md:col-span-2">
              <SubmitButton type="submit">Guardar utilizador</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quadro de utilizadores</CardTitle>
          <CardDescription>{users.length} utilizadores configurados na aplicação.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Utilizador</TH>
                <TH>Nome</TH>
                <TH>Perfil</TH>
                <TH>Estado</TH>
                <TH>Ações</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((user) => (
                <TR key={user.id}>
                  <TD>
                    <p className="font-semibold text-white">@{user.username}</p>
                    <p className="text-xs text-slate-500">{user.rank ?? "Sem posto"}</p>
                  </TD>
                  <TD>{user.name}</TD>
                  <TD>
                    <Badge variant={user.role === Role.COMMANDER ? "warning" : "default"}>
                      {user.role === Role.COMMANDER ? "Comandante" : "Tripulante"}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant={user.active ? "success" : "danger"}>{user.active ? "Ativo" : "Inativo"}</Badge>
                  </TD>
                  <TD>
                    <div className="flex flex-col gap-2">
                      <form action={saveUserAction} className="grid gap-2 lg:grid-cols-2">
                        <input type="hidden" name="id" value={user.id} />
                        <Input name="username" defaultValue={user.username} />
                        <Input name="name" defaultValue={user.name} />
                        <Input name="rank" defaultValue={user.rank ?? ""} />
                        <Select name="role" defaultValue={user.role}>
                          <option value={Role.COMMANDER}>Comandante</option>
                          <option value={Role.CREW_MEMBER}>Tripulante</option>
                        </Select>
                        <Input name="password" type="password" placeholder="Nova senha (opcional)" />
                        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs">
                          <input name="active" type="checkbox" defaultChecked={user.active} className="h-4 w-4 accent-[#c9a958]" />
                          Ativo
                        </label>
                        <div className="lg:col-span-2 flex gap-2">
                          <SubmitButton size="sm">Atualizar</SubmitButton>
                        </div>
                      </form>
                      {user.active ? (
                        <ConfirmDialog
                          trigger={<Button size="sm" variant="destructive">Desativar</Button>}
                          title="Desativar utilizador"
                          description={`Tem a certeza que pretende desativar ${user.name}? O utilizador perderá acesso à plataforma imediatamente.`}
                          confirmLabel="Desativar"
                          onConfirm={async () => {
                            "use server";
                            const fd = new FormData();
                            fd.append("userId", user.id);
                            await toggleUserStatusAction(fd);
                          }}
                        />
                      ) : (
                        <form action={toggleUserStatusAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton size="sm" variant="secondary">Reativar</SubmitButton>
                        </form>
                      )}
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