import { Check, Loader2, X } from 'lucide-react';
import { cn } from './ui/utils';

export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

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
    <div className={cn('w-full', className)}>
      {/* Steps Container */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isError = step.status === 'error';
          const isPending = step.status === 'pending';

          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              {/* Circle */}
              <div className="relative z-10 bg-gray-900 rounded-full">
                {isCompleted && (
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                )}
                {isActive && (
                  <div className="w-10 h-10 rounded-full bg-green-500/30 border-2 border-green-500 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                  </div>
                )}
                {isError && (
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/50">
                    <X className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                )}
                {isPending && (
                  <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-400">{index + 1}</span>
                  </div>
                )}
              </div>

              {/* Label */}
              <p
                className={cn(
                  'text-xs font-medium mt-2 text-center transition-colors',
                  isCompleted && 'text-green-400',
                  isActive && 'text-green-400',
                  isError && 'text-red-400',
                  isPending && 'text-gray-500'
                )}
              >
                {step.label}
              </p>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn('absolute top-5 left-1/2 w-full h-1 -z-10 transition-all duration-300', isCompleted || isError ? 'bg-green-500' : 'bg-gray-700')}
                  style={{
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
