"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

export const BackgroundDots = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { currentTarget, clientX, clientY } = event;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePosition({
      x: clientX - left,
      y: clientY - top,
    });
  }

  return (
    <div
      className={cn("relative h-full w-full bg-background", containerClassName)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Base dots layer */}
      <div
        className="absolute inset-0 bg-dot-thick-slate-400/20 dark:bg-dot-thick-slate-400/20"
        style={{ backgroundSize: "16px 16px" }}
      />

      {/* Hover effect layer */}
      <div
        className="absolute inset-0 bg-dot-thick-indigo-600 dark:bg-dot-thick-indigo-300 transition-opacity duration-300"
        style={{
          backgroundSize: "16px 16px",
          opacity: isHovering ? 1 : 0,
          maskImage: `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(150px circle at ${mousePosition.x}px ${mousePosition.y}px, black, transparent)`,
        }}
      />

      {/* Content layer */}
      <div className={cn("relative", className)}>{children}</div>
    </div>
  );
};
