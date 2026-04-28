import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border border-white/10 bg-white/10 text-slate-200",
  success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border border-rose-500/30 bg-rose-500/10 text-rose-300",
  muted: "border border-slate-500/30 bg-slate-500/10 text-slate-300",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]", variants[variant], className)}
      {...props}
    />
  );
}