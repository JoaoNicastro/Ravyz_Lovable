import React from 'react';
import { cn } from '@/lib/utils';

interface InteractiveScaleProps {
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const scaleOptions = [
  { value: 1, label: 'Discordo totalmente' },
  { value: 2, label: 'Discordo' },
  { value: 3, label: 'Neutro' },
  { value: 4, label: 'Concordo' },
  { value: 5, label: 'Concordo totalmente' },
];

export const InteractiveScale: React.FC<InteractiveScaleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "relative group flex flex-col items-center justify-center",
              "p-4 md:p-6 rounded-xl border-2 transition-all duration-300",
              "hover:scale-105 hover:shadow-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              value === option.value
                ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {/* Number */}
            <span className={cn(
              "text-3xl md:text-4xl font-bold mb-2 transition-colors",
              value === option.value ? "text-primary-foreground" : "text-foreground"
            )}>
              {option.value}
            </span>
            
            {/* Label */}
            <span className={cn(
              "text-xs md:text-sm font-medium text-center transition-colors",
              value === option.value ? "text-primary-foreground" : "text-muted-foreground"
            )}>
              {option.label}
            </span>

            {/* Selection indicator */}
            {value === option.value && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center animate-scale-in">
                <svg
                  className="w-4 h-4 text-success-foreground"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Discordo totalmente</span>
        <span className="hidden md:inline">Neutro</span>
        <span>Concordo totalmente</span>
      </div>
    </div>
  );
};
