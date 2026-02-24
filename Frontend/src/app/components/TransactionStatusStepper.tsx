import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "./ui/utils";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface Step {
  label: string;
  description?: string;
  status: StepStatus;
}

interface TransactionStatusStepperProps {
  steps: Step[];
  className?: string;
}

export function TransactionStatusStepper({ steps, className }: TransactionStatusStepperProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          {/* Step */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0">
              {step.status === "completed" && (
                <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              )}
              {step.status === "active" && (
                <div className="w-8 h-8 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                </div>
              )}
              {step.status === "pending" && (
                <div className="w-8 h-8 rounded-full bg-gray-500/10 border-2 border-gray-500/30 flex items-center justify-center">
                  <Circle className="w-3 h-3 text-gray-500 fill-gray-500" />
                </div>
              )}
              {step.status === "error" && (
                <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                  <span className="text-red-400 text-sm font-bold">✕</span>
                </div>
              )}
            </div>

            {/* Label */}
            <div className="text-center">
              <p
                className={cn(
                  "text-xs font-medium transition-colors",
                  step.status === "completed" && "text-green-400",
                  step.status === "active" && "text-violet-400",
                  step.status === "pending" && "text-gray-500",
                  step.status === "error" && "text-red-400"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-full -mt-8 transition-colors",
                step.status === "completed" ? "bg-green-500/30" : "bg-gray-500/20"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
