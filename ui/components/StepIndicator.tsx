import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  currentStep: number;
  steps: Array<{
    step: number;
    label: string;
    detail: string;
  }>;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 10.5 8.5 14 15 7.5" />
    </svg>
  );
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  const activeStep = steps.find((item) => item.step === currentStep);

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-2" aria-label="Booking progress">
        {steps.map((item) => {
          const isActive = item.step === currentStep;
          const isComplete = item.step < currentStep;

          return (
            <li
              key={item.step}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                isActive &&
                  "border-[color:var(--info-border)] bg-[color:var(--info-soft)] text-[color:var(--info-strong)]",
                isComplete &&
                  "border-[color:var(--success)]/20 bg-[color:var(--success-soft)] text-[color:var(--success)]",
                !isActive && !isComplete && "border-zinc-200 bg-zinc-100 text-zinc-500",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isActive && "bg-[color:var(--info)] text-white",
                  isComplete && "bg-white text-[color:var(--success)]",
                  !isActive && !isComplete && "bg-white text-zinc-500",
                )}
              >
                {isComplete ? <CheckIcon /> : item.step}
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>

      {activeStep ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="default">Current step</Badge>
          <p className="text-zinc-500">{activeStep.detail}</p>
        </div>
      ) : null}
    </div>
  );
}
