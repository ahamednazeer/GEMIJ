import React from 'react';
import { cn } from '@/utils/cn';
import Badge from './Badge';

interface StatusCardProps {
  title: string;
  status: string;
  statusVariant?: 'neutral' | 'info' | 'success' | 'warning' | 'error';
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  statusVariant = 'neutral',
  description,
  children,
  className
}) => {
  return (
    <div className={cn(
      'card',
      'transition-all duration-200',
      className
    )}>
      <div className="card-header flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Badge variant={statusVariant} className="ml-4 flex-shrink-0">
          {status}
        </Badge>
      </div>
      {children && (
        <div className="card-body">
          {children}
        </div>
      )}
    </div>
  );
};

export default StatusCard;

