"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface KpiCardsCarouselProps {
  children: React.ReactNode;
  className?: string;
  autoScroll?: boolean;
  speed?: number; // pixels per frame (default ~0.9 for smooth elegant glide)
  pauseOnHover?: boolean;
}

export function KpiCardsCarousel({
  children,
  className = "",
  autoScroll = true,
  speed = 0.9,
  pauseOnHover = false,
}: KpiCardsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const startXRef = useRef<number>(0);
  const startScrollLeftRef = useRef<number>(0);

  // Measure single set width for seamless infinite wrap
  const getFirstSetWidth = useCallback(() => {
    if (firstSetRef.current) {
      return firstSetRef.current.offsetWidth;
    }
    return 0;
  }, []);

  // Wrap boundary helper (bidirectional infinite loop)
  const wrapScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const firstSetWidth = getFirstSetWidth();
    if (firstSetWidth <= 0) return;

    // Wrap when scrolling far right into set 2/3
    if (track.scrollLeft >= firstSetWidth * 2) {
      track.scrollLeft -= firstSetWidth;
      scrollPosRef.current = track.scrollLeft;
      startScrollLeftRef.current -= firstSetWidth;
    }
    // Wrap when scrolling left into set 0
    else if (track.scrollLeft <= 5) {
      track.scrollLeft += firstSetWidth;
      scrollPosRef.current = track.scrollLeft;
      startScrollLeftRef.current += firstSetWidth;
    }
  }, [getFirstSetWidth]);

  // Schedule resume after user interaction ends
  const scheduleResume = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      if (trackRef.current) {
        scrollPosRef.current = trackRef.current.scrollLeft;
      }
    }, 1800);
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  // Initialize scroll position in the middle set (Set 1) so user can scroll left or right immediately
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const timer = setTimeout(() => {
      const firstSetWidth = getFirstSetWidth();
      if (firstSetWidth > 0) {
        track.scrollLeft = firstSetWidth;
        scrollPosRef.current = firstSetWidth;
        setCanScroll(true);
      }
    }, 100);

    const handleResize = () => {
      wrapScroll();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [getFirstSetWidth, wrapScroll]);

  // Continuous animation frame loop for auto-scroll
  useEffect(() => {
    if (!autoScroll) return;

    let animId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;

      const track = trackRef.current;
      if (track && !isInteractingRef.current && !isDragging) {
        const effectiveSpeed = pauseOnHover && isHovered ? speed * 0.25 : speed;
        const firstSetWidth = getFirstSetWidth();

        if (firstSetWidth > 0 && effectiveSpeed > 0) {
          scrollPosRef.current += effectiveSpeed * delta;

          if (scrollPosRef.current >= firstSetWidth * 2) {
            scrollPosRef.current -= firstSetWidth;
            track.scrollLeft = scrollPosRef.current;
          } else {
            track.scrollLeft = Math.floor(scrollPosRef.current);
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [autoScroll, speed, pauseOnHover, isDragging, isHovered, getFirstSetWidth]);

  // Native onScroll listener for touch & trackpad gestures
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;

    if (isInteractingRef.current || isDragging) {
      scrollPosRef.current = track.scrollLeft;
      wrapScroll();
      scheduleResume();
    }
  };

  // Touch handlers (Mobile & Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    clearResumeTimer();
    isInteractingRef.current = true;
    const track = trackRef.current;
    if (track) {
      startXRef.current = e.touches[0].pageX;
      startScrollLeftRef.current = track.scrollLeft;
      scrollPosRef.current = track.scrollLeft;
    }
    setHasMoved(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    isInteractingRef.current = true;
    const diff = Math.abs(e.touches[0].pageX - startXRef.current);
    if (diff > 5) {
      setHasMoved(true);
    }
    if (trackRef.current) {
      scrollPosRef.current = trackRef.current.scrollLeft;
      wrapScroll();
    }
    scheduleResume();
  };

  const handleTouchEnd = () => {
    if (trackRef.current) {
      scrollPosRef.current = trackRef.current.scrollLeft;
      wrapScroll();
    }
    scheduleResume();
  };

  // Mouse drag handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;

    clearResumeTimer();
    isInteractingRef.current = true;
    setIsDragging(true);
    setHasMoved(false);
    startXRef.current = e.pageX;
    startScrollLeftRef.current = track.scrollLeft;
    scrollPosRef.current = track.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const track = trackRef.current;
    if (!track) return;

    const diffX = e.pageX - startXRef.current;
    if (Math.abs(diffX) > 4) {
      setHasMoved(true);
    }
    const newScroll = startScrollLeftRef.current - diffX;
    track.scrollLeft = newScroll;
    scrollPosRef.current = newScroll;
    wrapScroll();
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (trackRef.current) {
        scrollPosRef.current = trackRef.current.scrollLeft;
        wrapScroll();
      }
      scheduleResume();
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (trackRef.current) {
        scrollPosRef.current = trackRef.current.scrollLeft;
        wrapScroll();
      }
      scheduleResume();
    }
    setIsHovered(false);
  };

  // Wheel event handler (touchpad / horizontal mouse wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 2 || e.shiftKey) {
      clearResumeTimer();
      isInteractingRef.current = true;
      if (trackRef.current) {
        scrollPosRef.current = trackRef.current.scrollLeft;
        wrapScroll();
      }
      scheduleResume();
    }
  };

  // Smooth slide buttons (directional manual steps)
  const slide = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;

    clearResumeTimer();
    isInteractingRef.current = true;

    const stepAmount = Math.max(260, track.clientWidth * 0.45);
    const target = direction === "left" ? track.scrollLeft - stepAmount : track.scrollLeft + stepAmount;

    track.scrollTo({
      left: target,
      behavior: "smooth",
    });

    setTimeout(() => {
      wrapScroll();
      scheduleResume();
    }, 450);
  };

  // Prevent link click when dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden group/carousel ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left Smooth Step Button */}
      <button
        type="button"
        onClick={() => slide("left")}
        aria-label="Scroll left"
        className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-[#141416]/90 border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 dark:text-zinc-200 shadow-md backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity hover:scale-105 active:scale-95 hidden sm:flex items-center justify-center cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Right Smooth Step Button */}
      <button
        type="button"
        onClick={() => slide("right")}
        aria-label="Scroll right"
        className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-[#141416]/90 border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 dark:text-zinc-200 shadow-md backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 transition-opacity hover:scale-105 active:scale-95 hidden sm:flex items-center justify-center cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Left Fade Gradient (Edge disappearance effect) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-20 bg-gradient-to-r from-background dark:from-[#09090b] via-background/80 dark:via-[#09090b]/80 to-transparent z-20 pointer-events-none"
      />

      {/* Right Fade Gradient (Edge disappearance effect) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-20 bg-gradient-to-l from-background dark:from-[#09090b] via-background/80 dark:via-[#09090b]/80 to-transparent z-20 pointer-events-none"
      />

      {/* Scrollable Track */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClickCapture={handleClickCapture}
        className={`flex items-stretch overflow-x-auto select-none py-2 sm:py-3 touch-pan-x ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`}
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Set 0 (Safety clone for backward left scroll) */}
        <div className="flex shrink-0 items-stretch gap-2.5 sm:gap-4 md:gap-5 pr-2.5 sm:pr-4 md:pr-5" aria-hidden="true">
          {children}
        </div>

        {/* Set 1 (Master / Middle Initial View) */}
        <div ref={firstSetRef} className="flex shrink-0 items-stretch gap-2.5 sm:gap-4 md:gap-5 pr-2.5 sm:pr-4 md:pr-5">
          {children}
        </div>

        {/* Set 2 (Forward clone for seamless right scroll) */}
        <div className="flex shrink-0 items-stretch gap-2.5 sm:gap-4 md:gap-5 pr-2.5 sm:pr-4 md:pr-5" aria-hidden="true">
          {children}
        </div>

        {/* Set 3 (Buffer clone for ultra-wide screens) */}
        <div className="flex shrink-0 items-stretch gap-2.5 sm:gap-4 md:gap-5 pr-2.5 sm:pr-4 md:pr-5" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
