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
    <nav className={cn('w-full', className)} aria-label="Progress">
      <ol className="flex items-center justify-between" role="list">
        {steps.map((label, idx) => {
          const stepNumber = idx + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;
          const canClick = !!onStepChange && (isDone || isCurrent);

          return (
            <li key={label} className="flex items-center">
              <button
                type="button"
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  isCurrent && 'bg-primary-600 text-white',
                  isDone && 'bg-primary-600 text-white',
                  isFuture && 'bg-secondary-200 text-secondary-600',
                  !canClick && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={!canClick}
                onClick={() => canClick && onStepChange?.(stepNumber)}
              >
                {stepNumber}
              </button>
              <span
                className={cn(
                  'ml-2 text-sm font-medium',
                  isCurrent ? 'text-primary-600' : 'text-secondary-500'
                )}
              >
                {label}
              </span>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-4',
                    stepNumber < currentStep ? 'bg-primary-600' : 'bg-secondary-200'
                  )}
                  aria-hidden
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
