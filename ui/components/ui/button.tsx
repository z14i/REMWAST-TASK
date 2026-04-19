import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-[color:var(--info)] text-white hover:bg-[color:var(--info-hover)] shadow-sm",
  outline:
    "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  ghost:
    "text-zinc-700 hover:bg-zinc-100",
};

export function Button({
  className,
  type = "button",
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--info)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
