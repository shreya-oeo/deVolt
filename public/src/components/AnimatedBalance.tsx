"use client";

import { useEffect, useState } from 'react';

interface AnimatedBalanceProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  isUpdating?: boolean;
}

export const AnimatedBalance = ({
  value,
  prefix = '$',
  suffix = '',
  decimals = 2,
  className = '',
  isUpdating = false
}: AnimatedBalanceProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue === value) return;

    setIsAnimating(true);
    const duration = 800; // Animation duration in ms
    const steps = 30;
    const stepValue = (value - displayValue) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayValue(prev => prev + stepValue);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, displayValue]);

  return (
    <span 
      className={`${className} ${isAnimating || isUpdating ? 'animate-pulse' : ''} transition-all duration-300`}
    >
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};
