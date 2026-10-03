/**
 * Official Car Wash Logo Component
 * Conforms to the provided emblem:
 * - Cyan shield badge outline
 * - Foamy soap bubble clouds
 * - Sleek white modern SUV with dark navy windows
 * - Bold white "CARWASH" title
 * - White subtitle "EXCELLENT AUTO WASHING AND DETAILING"
 * Designed to sit with high contrast on dark navy (#042544) backgrounds.
 */
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const dimensions = {
    sm: 'h-10 w-auto',
    md: 'h-14 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-28 w-auto'
  }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <img
        src="/logo.svg"
        alt="CARWASH - Excellent Auto Washing and Detailing"
        className={`${dimensions} object-contain shrink-0`}
        loading="eager"
      />
    </div>
  );
};
