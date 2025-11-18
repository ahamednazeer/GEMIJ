import React from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  title?: string;
}

const variants: Record<NonNullable<AlertProps['variant']>, { base: string; icon: React.ElementType; role: 'status' | 'alert' }> = {
  neutral: { base: 'bg-secondary-50 text-secondary-800 border-secondary-200', icon: Info, role: 'status' },
  info: { base: 'bg-blue-50 text-blue-800 border-blue-200', icon: Info, role: 'status' },
  success: { base: 'bg-green-50 text-green-800 border-green-200', icon: CheckCircle2, role: 'status' },
  warning: { base: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: AlertTriangle, role: 'status' },
  error: { base: 'bg-red-50 text-red-800 border-red-200', icon: XCircle, role: 'alert' },
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant = 'neutral', title, children, ...props }, ref) => {
  const { base, icon: Icon, role } = variants[variant];
  return (
    <div
      ref={ref}
      role={role}
      className={cn('w-full rounded-md border p-4', base, className)}
      {...props}
    >
      <div className="flex gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div>
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
});

Alert.displayName = 'Alert';

export default Alert;
