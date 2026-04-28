"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "bg-[#0b1220] border border-white/10 text-white shadow-xl",
            title: "text-white font-semibold",
            description: "text-slate-400",
            success: "border-emerald-500/30 bg-emerald-500/10",
            error: "border-rose-500/30 bg-rose-500/10",
          },
        }}
      />
    </SessionProvider>
  );
}