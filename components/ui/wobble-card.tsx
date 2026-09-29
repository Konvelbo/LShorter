"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export const WobbleCard = ({
  children,
  containerClassName,
  className,
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 20;
    const y = (clientY - (rect.top + rect.height / 2)) / 20;

    if (sectionRef.current) {
      gsap.to(sectionRef.current, {
        x,
        y,
        duration: 0.2,
        ease: "power2.out",
      });
    }
    if (innerRef.current) {
      gsap.to(innerRef.current, {
        x: -x,
        y: -y,
        scale: 1.025,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    if (sectionRef.current) {
      gsap.to(sectionRef.current, {
        x: 0,
        y: 0,
        duration: 0.25,
        ease: "power2.out",
      });
    }
    if (innerRef.current) {
      gsap.to(innerRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "mx-auto w-full relative rounded-[10px] overflow-hidden will-change-transform",
        containerClassName
      )}
    >
      <div
        className="relative h-full [background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.5),rgba(255,255,255,0))] sm:mx-0 sm:rounded-[10px] overflow-hidden"
        style={{
          boxShadow:
            "0 10px 32px 0 rgba(34, 42, 53, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(34, 42, 53, 0.05), 0 4px 6px 0 rgba(34, 42, 53, 0.08), 0 24px 108px 0 rgba(47, 48, 55, 0.10)",
        }}
      >
        <div
          ref={innerRef}
          className={cn("h-full px-5 py-12 sm:px-10 sm:py-16", className)}
        >
          <Noise />
          {children}
        </div>
      </div>
    </section>
  );
};

const Noise = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-[0.07] pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
        backgroundSize: "14px 14px",
      }}
    />
  );
};
