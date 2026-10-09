import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

const styles = {
  info: { box: "border-teal-100 bg-teal-50 text-teal-900", Icon: Info },
  success: { box: "border-[#cfe3d6] bg-[#eef6f1] text-success", Icon: CircleCheck },
  error: { box: "border-[#ecc9c3] bg-[#fbf0ee] text-danger", Icon: CircleAlert },
  warning: { box: "border-[#ecdcb9] bg-[#fbf5e8] text-warning", Icon: CircleAlert },
} as const;

export function Alert({ tone = "info", title, children, className }: { tone?: keyof typeof styles; title?: string; children?: ReactNode; className?: string }) {
  const { box, Icon } = styles[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-relaxed">{children}</div> : null}
      </div>
    </div>
  );
}
