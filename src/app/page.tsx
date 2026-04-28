import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck, Plane, ClipboardCheck } from "lucide-react";
import { auth, getDashboardPath } from "@/lib/auth";
import { squadron } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export default async function Home() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getDashboardPath(session.user.role));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04080f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(201,169,88,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(139,30,30,0.25),_transparent_30%),linear-gradient(180deg,#04080f_0%,#08111d_55%,#04080f_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:70px_70px]" />
      <main className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#c9a958]/30 bg-[#c9a958]/10 px-4 py-2 text-xs uppercase tracking-[0.34em] text-[#f6e7c1]">
            Sistema institucional de controlo operacional
          </div>
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.42em] text-slate-400">{squadron.unit}</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-tight text-white sm:text-6xl">
              Gestão de horas de voo para a <span className="text-[#f6e7c1]">{squadron.name}</span>.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Plataforma segura para registo, aprovação e monitorização de horas de voo do C-295, com foco em prontidão operacional, disciplina documental e controlo de limites por tripulante.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="space-y-3 p-5">
                <ShieldCheck className="h-6 w-6 text-[#c9a958]" />
                <div>
                  <p className="font-semibold text-white">Autenticação por perfis</p>
                  <p className="text-sm text-slate-400">Comandante e tripulante com acessos distintos.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-5">
                <Plane className="h-6 w-6 text-[#c9a958]" />
                <div>
                  <p className="font-semibold text-white">Registo operacional</p>
                  <p className="text-sm text-slate-400">Missões, aeronaves, rotas e duração com dados reais.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-5">
                <ClipboardCheck className="h-6 w-6 text-[#c9a958]" />
                <div>
                  <p className="font-semibold text-white">Aprovação e auditoria</p>
                  <p className="text-sm text-slate-400">Fluxo completo de submissão, decisão e rastreio.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="mx-auto w-full max-w-lg">
          <Card className="overflow-hidden">
            <div className="border-b border-white/10 bg-[linear-gradient(120deg,rgba(201,169,88,0.1),rgba(139,30,30,0.12))] p-8">
              <div className="flex items-center gap-5">
                <Image
                  src="/images/squadron-patch.png"
                  alt="Patch da Esquadra 271"
                  width={96}
                  height={96}
                  className="rounded-full border border-[#c9a958]/30 bg-black/20 p-2"
                  priority
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Entrada segura</p>
                  <h2 className="mt-2 font-serif text-4xl text-white">Bem-vindo</h2>
                  <p className="mt-2 text-sm text-slate-300">{squadron.motto}</p>
                </div>
              </div>
            </div>
            <CardContent className="space-y-6 p-8">
              <LoginForm />
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-[#f6e7c1]">Credenciais iniciais</p>
                <p className="mt-2">Comandante: <span className="font-semibold">antonio / commander123</span></p>
                <p className="mt-1">Tripulante de demonstração: <span className="font-semibold">manuel / tripulante123</span></p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
