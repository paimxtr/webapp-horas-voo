import { cn } from "@/lib/utils";

export function FeedbackBanner({ type, text }: { type: string; text: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        type === "sucesso"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-rose-500/30 bg-rose-500/10 text-rose-200",
      )}
    >
      {text}
    </div>
  );
}