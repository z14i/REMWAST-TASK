import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "success" | "warning" | "danger";

const variants: Record<AlertVariant, string> = {
  default: "border-zinc-200 bg-zinc-50 text-zinc-700",
  success:
    "border-[color:var(--success)]/20 bg-[color:var(--success-soft)] text-[color:var(--success)]",
  warning:
    "border-[color:var(--warning)]/20 bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
  danger:
    "border-[color:var(--danger)]/20 bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
};

export function Alert({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      className={cn("rounded-xl border px-4 py-3 text-sm", variants[variant], className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-medium", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-1 leading-6", className)} {...props} />;
}
