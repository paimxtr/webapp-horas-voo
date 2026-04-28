import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#04080f] px-6 text-white">
      <div className="max-w-md rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <ShieldX className="h-14 w-14 text-rose-400" />
        </div>
        <p className="text-sm uppercase tracking-[0.36em] text-rose-400">Acesso negado · 403</p>
        <h1 className="mt-4 font-serif text-4xl text-white">Sem autorização</h1>
        <p className="mt-3 text-sm text-slate-400">
          Não tem permissão para aceder a este recurso. Verifique o seu perfil ou contacte o comandante.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Regressar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
