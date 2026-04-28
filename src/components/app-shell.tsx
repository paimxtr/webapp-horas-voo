import Image from "next/image";
import Link from "next/link";
import { Role } from "@prisma/client";
import type { ReactNode } from "react";
import { squadron } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";

type AppShellProps = {
  children: ReactNode;
  user: {
    name?: string | null;
    username: string;
    role: Role;
  };
};

const commanderLinks = [
  { href: "/comando", label: "Painel" },
  { href: "/comando/utilizadores", label: "Utilizadores" },
  { href: "/comando/aeronaves", label: "Aeronaves" },
  { href: "/comando/missoes", label: "Missões" },
  { href: "/comando/aprovacoes", label: "Aprovações" },
  { href: "/comando/limites", label: "Limites" },
  { href: "/comando/escalas", label: "Escalas" },
  { href: "/comando/relatorios", label: "Relatórios" },
];

const crewLinks = [
  { href: "/tripulante", label: "Resumo" },
  { href: "/tripulante/registos", label: "Registos de voo" },
  { href: "/tripulante/escalas", label: "Escalas" },
];

export function AppShell({ children, user }: AppShellProps) {
  const links = user.role === Role.COMMANDER ? commanderLinks : crewLinks;

  return (
    <div className="min-h-screen bg-[#04080f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,169,88,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(139,30,30,0.18),_transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-black/35 px-6 py-6 backdrop-blur lg:min-h-screen lg:w-[300px] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-4">
            <Image src="/images/squadron-patch.png" alt="Patch da Esquadra 271" width={72} height={72} className="rounded-full border border-[#c9a958]/30" priority />
            <div>
              <p className="font-serif text-xl text-[#f6e7c1]">{squadron.name}</p>
              <p className="text-sm text-slate-400">{squadron.unit}</p>
            </div>
          </div>
          <div className="mt-8 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-xl border border-transparent px-4 py-3 text-sm font-semibold tracking-[0.18em] text-slate-300 transition hover:border-[#c9a958]/30 hover:bg-[#c9a958]/10 hover:text-[#f6e7c1]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sessão ativa</p>
            <p className="mt-2 font-semibold text-white">{user.name}</p>
            <p className="text-sm text-slate-400">@{user.username}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#c9a958]">{user.role === Role.COMMANDER ? "Comandante" : "Tripulante"}</p>
            <div className="mt-4">
              <SignOutButton />
            </div>
          </div>
        </aside>
        <main className="relative flex-1 p-4 sm:p-6 lg:p-10">
          <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-[#c9a958]">{squadron.motto}</p>
                <h1 className="mt-2 font-serif text-3xl text-white">Sistema de Horas de Voo C-295</h1>
              </div>
              <p className="max-w-xl text-sm text-slate-400">
                Plataforma operacional da {squadron.name} para controlo, submissão e aprovação de horas de voo com foco em vigilância, prontidão e soberania.
              </p>
            </div>
          </header>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}