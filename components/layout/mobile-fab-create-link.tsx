"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link2 } from "lucide-react";

const BUTTON_SIZE = 50; // 50px button requested by user
const EDGE_SPACING = 16; // 16px lateral padding

export function MobileFabCreateLink() {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Position offset relative to initial bottom-right (bottom: 24px, right: 16px)
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);

    // Restore saved lateral dock side & vertical offset if exists
    try {
      const saved = localStorage.getItem("lshorter_mobile_fab_dock");
      if (saved) {
        const { side, offsetY } = JSON.parse(saved);
        const maxOffsetLeft = -(window.innerWidth - BUTTON_SIZE - EDGE_SPACING * 2);
        const restoredX = side === "left" ? maxOffsetLeft : 0;
        const clampedY = Math.max(-(window.innerHeight - 150), Math.min(8, offsetY || 0));

        offsetRef.current = { x: restoredX, y: clampedY };
        if (buttonRef.current) {
          buttonRef.current.style.transform = `translate3d(${restoredX}px, ${clampedY}px, 0)`;
        }
      }
    } catch {}

    const handleResize = () => {
      if (!buttonRef.current) return;
      const maxOffsetLeft = -(window.innerWidth - BUTTON_SIZE - EDGE_SPACING * 2);
      const isLeftSide = offsetRef.current.x < maxOffsetLeft / 2;
      const targetX = isLeftSide ? maxOffsetLeft : 0;
      const clampedY = Math.max(-(window.innerHeight - 150), Math.min(8, offsetRef.current.y));

      offsetRef.current = { x: targetX, y: clampedY };
      buttonRef.current.style.transform = `translate3d(${targetX}px, ${clampedY}px, 0)`;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    const btn = buttonRef.current;
    if (!btn) return;

    btn.style.transition = "none";
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      origOffsetX: offsetRef.current.x,
      origOffsetY: offsetRef.current.y,
      hasMoved: false,
    };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    const btn = buttonRef.current;
    if (!drag || !btn) return;

    const dx = clientX - drag.startX;
    const dy = clientY - drag.startY;

    if (!drag.hasMoved && Math.hypot(dx, dy) > 5) {
      drag.hasMoved = true;
      setIsDragging(true);
    }

    if (drag.hasMoved) {
      const maxOffsetLeft = -(window.innerWidth - BUTTON_SIZE - EDGE_SPACING * 2);
      const minTranslateY = -(window.innerHeight - 150);
      const maxTranslateY = 8;

      const rawX = drag.origOffsetX + dx;
      const rawY = drag.origOffsetY + dy;

      const clampedX = Math.max(maxOffsetLeft, Math.min(8, rawX));
      const clampedY = Math.max(minTranslateY, Math.min(maxTranslateY, rawY));

      offsetRef.current = { x: clampedX, y: clampedY };
      btn.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    }
  };

  const endDrag = () => {
    const drag = dragRef.current;
    const btn = buttonRef.current;
    if (!drag || !btn) return;

    dragRef.current = null;

    if (!drag.hasMoved) {
      // Tap/click detected -> open creation modal
      setIsDragging(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lshorter:open-create-drawer"));
      }
      try {
        navigator.vibrate?.(15);
      } catch {}
      return;
    }

    // Drag release -> snap cleanly to nearest lateral edge (left or right side)
    setIsDragging(false);

    const fullLeftOffset = -(window.innerWidth - BUTTON_SIZE - EDGE_SPACING * 2);
    const isLeftSide = offsetRef.current.x < fullLeftOffset / 2;
    const targetX = isLeftSide ? fullLeftOffset : 0;
    const clampedY = Math.max(-(window.innerHeight - 150), Math.min(8, offsetRef.current.y));

    offsetRef.current = { x: targetX, y: clampedY };

    // Fluid spring bounce snapping to lateral edge
    btn.style.transition = "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.25)";
    btn.style.transform = `translate3d(${targetX}px, ${clampedY}px, 0)`;

    // Persist preferred side
    try {
      localStorage.setItem(
        "lshorter_mobile_fab_dock",
        JSON.stringify({ side: isLeftSide ? "left" : "right", offsetY: clampedY })
      );
    } catch {}
  };

  // Pointer Events (Mouse / Pen / Modern Touch)
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startDrag(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    moveDrag(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    endDrag();
  };

  // Touch Events (iOS Safari & touch fallback)
  const onTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (e.touches.length === 1 && dragRef.current) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    endDrag();
  };

  if (!mounted) return null;

  return (
    <button
      id="mobile-fab-create-link"
      data-testid="mobile-fab-create-link"
      ref={buttonRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={endDrag}
      style={{
        touchAction: "none",
        willChange: "transform",
      }}
      className={`sm:hidden fixed bottom-6 right-4 z-40 w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] rounded-full aspect-square flex items-center justify-center bg-[#0066FF] hover:bg-[#0052cc] text-white cursor-grab active:cursor-grabbing border-2 border-white/20 select-none shadow-[0_5px_20px_rgba(0,102,255,0.45)] dark:shadow-[0_5px_24px_rgba(0,102,255,0.65)] active:scale-95 transition-colors shrink-0 ${
        isDragging ? "shadow-[0_8px_28px_rgba(0,102,255,0.75)] scale-105" : ""
      }`}
      title="Create Link"
      aria-label="Floating create link button"
    >
      <Link2 className="w-[22px] h-[22px] text-white stroke-[2.4] shrink-0" />
    </button>
  );
}
