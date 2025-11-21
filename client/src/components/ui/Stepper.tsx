import React from 'react';
import { cn } from '@/utils/cn';

interface StepperProps {
  steps: string[];
  currentStep: number; // 1-based index
  onStepChange?: (step: number) => void;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepChange, className }) => {
  return (
    <nav className={cn('w-full', className)} aria-label="Submission progress">
      <ol className="flex items-center justify-between" role="list">
        {steps.map((label, idx) => {
          const stepNumber = idx + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;
          const canClick = !!onStepChange && (isDone || isCurrent);

          return (
            <li key={label} className="flex items-center flex-1">
              <div className="flex items-center flex-1">
                <button
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    isCurrent && 'bg-primary-600 text-white shadow-sm',
                    isDone && 'bg-primary-600 text-white',
                    isFuture && 'bg-secondary-100 text-secondary-500 border border-secondary-200',
                    canClick && 'hover:scale-105',
                    !canClick && 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-disabled={!canClick}
                  onClick={() => canClick && onStepChange?.(stepNumber)}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </button>
                <span
                  className={cn(
                    'ml-3 text-sm font-medium hidden sm:block',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-4 transition-colors duration-200',
                    stepNumber < currentStep ? 'bg-primary-300' : 'bg-secondary-200'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
