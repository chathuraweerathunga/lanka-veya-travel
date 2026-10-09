import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const tones = {
  neutral: "bg-ivory-deep text-ink",
  teal: "bg-teal-50 text-teal-800",
  palm: "bg-[#eef1ec] text-palm-700",
  gold: "bg-[#f6efe0] text-champagne-700",
  danger: "bg-[#f7e6e3] text-danger",
  success: "bg-[#e6f1ea] text-success",
  warning: "bg-[#f8eedc] text-warning",
} as const;

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-5", tones[tone], className)}
      {...props}
    />
  );
}
