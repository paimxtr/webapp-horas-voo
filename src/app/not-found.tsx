import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#04080f] px-6 text-white">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.36em] text-slate-500">404</p>
        <h1 className="mt-4 font-serif text-4xl">Registo não encontrado</h1>
        <p className="mt-3 text-sm text-slate-400">O recurso solicitado não existe ou deixou de estar disponível.</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Regressar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}