import { redirect } from "next/navigation";
import { feedbackQueryKeys } from "@/lib/constants";
import { toQueryValue } from "@/lib/utils";

export function redirectWithFeedback(path: string, type: "sucesso" | "erro", message: string): never {
  redirect(`${path}?${feedbackQueryKeys.type}=${type}&${feedbackQueryKeys.text}=${toQueryValue(message)}`);
}

export async function getFeedback(searchParams?: Promise<Record<string, string | string[] | undefined>>) {
  if (!searchParams) {
    return null;
  }

  const resolved = await searchParams;
  const type = resolved[feedbackQueryKeys.type];
  const text = resolved[feedbackQueryKeys.text];

  if (typeof type !== "string" || typeof text !== "string") {
    return null;
  }

  return { type, text };
}