"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Types
type TimelineContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
};

// Context
const TimelineContext = React.createContext<TimelineContextValue | undefined>(
  undefined,
);

export const useTimeline = () => {
  const context = React.useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimeline must be used within a Timeline");
  }
  return context;
};

// Components
export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: "horizontal" | "vertical";
}

export function Timeline({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = "vertical",
  className,
  ...props
}: TimelineProps) {
  const [activeStep, setInternalStep] = React.useState(defaultValue);

  const setActiveStep = React.useCallback(
    (step: number) => {
      if (value === undefined) {
        setInternalStep(step);
      }
      onValueChange?.(step);
    },
    [value, onValueChange],
  );

  const currentStep = value ?? activeStep;

  return (
    <TimelineContext.Provider
      value={{ activeStep: currentStep, setActiveStep }}
    >
      <div
        className={cn(
          "group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className,
        )}
        data-orientation={orientation}
        data-slot="timeline"
        {...props}
      />
    </TimelineContext.Provider>
  );
}

// TimelineContent
export function TimelineContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-neutral-400 text-sm", className)}
      data-slot="timeline-content"
      {...props}
    />
  );
}

// TimelineDate
export interface TimelineDateProps extends React.HTMLAttributes<HTMLTimeElement> {
  asChild?: boolean;
}

export function TimelineDate({
  className,
  ...props
}: TimelineDateProps) {
  return (
    <time
      className={cn(
        "mb-1 block font-medium text-neutral-500 text-xs group-data-[orientation=vertical]/timeline:max-sm:h-4",
        className,
      )}
      data-slot="timeline-date"
      {...props}
    />
  );
}

// TimelineHeader
export function TimelineHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative flex items-center", className)} data-slot="timeline-header" {...props} />
  );
}

// TimelineIndicator
export interface TimelineIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  isActive?: boolean;
  isCompleted?: boolean;
}

export function TimelineIndicator({
  isActive,
  isCompleted,
  className,
  children,
  ...props
}: TimelineIndicatorProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center rounded-full border-2 border-neutral-700 bg-[#141416] transition-all duration-300",
        (isActive || isCompleted) && "border-[var(--brand-primary)] text-[var(--brand-primary-text)]",
        isActive && "ring-4 ring-[var(--brand-primary-border)] bg-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary-glow)] scale-110",
        className,
      )}
      data-slot="timeline-indicator"
      {...props}
    >
      {children}
    </div>
  );
}

// TimelineItem
export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
}

export function TimelineItem({ step, className, ...props }: TimelineItemProps) {
  const { activeStep } = useTimeline();
  const isCompleted = step < activeStep;
  const isActive = step === activeStep;

  return (
    <div
      className={cn(
        "group/timeline-item relative flex flex-1 flex-col gap-0.5",
        className,
      )}
      data-completed={isCompleted || undefined}
      data-active={isActive || undefined}
      data-slot="timeline-item"
      {...props}
    />
  );
}

// TimelineSeparator
export function TimelineSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-0.5 bg-neutral-800 transition-colors duration-300 group-last/timeline-item:hidden group-data-completed/timeline-item:bg-[var(--brand-primary-border)]",
        className,
      )}
      data-slot="timeline-separator"
      {...props}
    />
  );
}

// TimelineTitle
export function TimelineTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-medium text-sm text-white", className)}
      data-slot="timeline-title"
      {...props}
    />
  );
}
