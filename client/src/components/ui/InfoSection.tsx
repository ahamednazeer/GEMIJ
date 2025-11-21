import React from 'react';
import { cn } from '@/utils/cn';

interface InfoSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  accent?: boolean;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  title,
  subtitle,
  children,
  className,
  headerClassName,
  accent = false
}) => {
  return (
    <div className={cn('card', className)}>
      <div className={cn(
        accent ? 'card-header-accent' : 'card-header',
        headerClassName
      )}>
        <h2 className="section-title">{title}</h2>
        {subtitle && (
          <p className="section-subtitle">{subtitle}</p>
        )}
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default InfoSection;

