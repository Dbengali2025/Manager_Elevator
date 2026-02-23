"use client";

import { useEffect, useState } from "react";

interface CircularProgressRingProps {
  value: number;
  total: number;
  label: string;
  color: string; // Tailwind stroke color class like "stroke-skyBlue"
  colorHex: string; // Hex value for the animated stroke
}

/**
 * SVG-based circular progress ring with animated fill.
 * Displays a number in the center with "of N" below.
 */
export default function CircularProgressRing({
  value,
  total,
  label,
  color,
  colorHex,
}: CircularProgressRingProps) {
  const [animatedOffset, setAnimatedOffset] = useState<number>(0);

  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? value / total : 0;
  const targetOffset = circumference * (1 - percent);

  // Animate on mount
  useEffect(() => {
    // Start fully undrawn
    setAnimatedOffset(circumference);
    // Animate to target after a short delay
    const timer = setTimeout(() => {
      setAnimatedOffset(targetOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [circumference, targetOffset]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E8ECF0"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorHex}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            className={`${color} transition-[stroke-dashoffset] duration-1000 ease-out`}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-charcoal">{value}</span>
          <span className="text-xs text-charcoal/50">of {total}</span>
        </div>
      </div>
      <p className="mt-sm text-sm font-medium text-charcoal/70 text-center">
        {label}
      </p>
    </div>
  );
}
