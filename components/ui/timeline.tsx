"use client";

import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

interface TimelineProps {
  data: TimelineEntry[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const Timeline = ({
  data,
  title,
  description,
  badge,
  className,
}: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setHeight(rect.height);
      }
    };

    updateHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && ref.current) {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(ref.current);
    }

    window.addEventListener("resize", updateHeight);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 75%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className={cn(
        "w-full bg-white dark:bg-[#09090B] font-sans md:px-10 transition-colors duration-300",
        className,
      )}
      ref={containerRef}
    >
      {(title || description || badge) && (
        <div className="max-w-7xl mx-auto pt-12 pb-6 px-4 md:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-3xl mx-auto"
          >
            {badge && <div className="mb-3">{badge}</div>}
            {title && (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed">
                {description}
              </p>
            )}
          </motion.div>
        </div>
      )}

      <div ref={ref} className="relative max-w-7xl mx-auto pb-16">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-8 md:pt-20 md:gap-10"
          >
            {/* Sticky Milestone Node & Title */}
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-28 md:top-32 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-[#09090B] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                <div className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-colors duration-300" />
              </div>
              <h3 className="hidden md:block text-lg md:pl-20 md:text-2xl lg:text-3xl font-bold tracking-tight text-neutral-700 dark:text-neutral-300">
                {item.title}
              </h3>
            </div>

            {/* Timeline Content Card */}
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
                {item.title}
              </h3>
              <motion.div
                initial={{ opacity: 0.85, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {item.content}
              </motion.div>
            </div>
          </div>
        ))}

        {/* Dynamic Vertical Scroll Beam */}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-800 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_5%,black_95%,transparent_100%)] pointer-events-none"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-blue-600 via-indigo-500 to-transparent from-[0%] via-[10%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
          />
        </div>
      </div>
    </div>
  );
};
