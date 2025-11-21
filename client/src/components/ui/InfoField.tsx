import React from 'react';
import { cn } from '@/utils/cn';

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName
}) => {
  return (
    <div className={cn('info-field', className)}>
      <div className={cn('info-label', labelClassName)}>{label}</div>
      <div className={cn('info-value', valueClassName)}>{value}</div>
    </div>
  );
};

export default InfoField;

