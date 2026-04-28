import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-[#101828] px-3 text-sm text-white focus:border-[#c9a958] focus:outline-none focus:ring-2 focus:ring-[#c9a958]/40",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}