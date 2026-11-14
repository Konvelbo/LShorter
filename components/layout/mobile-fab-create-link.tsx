"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link2 } from "lucide-react";

const BUTTON_SIZE = 50; // 50px button requested by user
const EDGE_SPACING = 16; // 16px lateral padding
const DRAG_THRESHOLD_PX = 12; // 12px slop to prevent mobile thumb tap-roll from cancelling taps

export function MobileFabCreateLink() {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Position offset relative to initial bottom-right (bottom: 24px, right: 16px)
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const suppressNextClickRef = useRef(false);
  const lastOpenTsRef = useRef(0);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Restore saved lateral dock side & vertical offset once buttonRef is mounted
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
  }, [mounted]);

  const triggerOpenDrawer = () => {
    const now = Date.now();
    if (now - lastOpenTsRef.current < 350) return;
    lastOpenTsRef.current = now;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lshorter:open-create-drawer"));
    }
    try {
      navigator.vibrate?.(15);
    } catch {}
  };

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

    if (!drag.hasMoved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      drag.hasMoved = true;
      suppressNextClickRef.current = true;
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

  const endDrag = (openOnTap = true) => {
    const drag = dragRef.current;
    const btn = buttonRef.current;
    if (!drag || !btn) return;

    dragRef.current = null;

    if (!drag.hasMoved) {
      setIsDragging(false);
      if (openOnTap) {
        triggerOpenDrawer();
      }
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

  // Pointer Events (Mouse / Pen / Touch)
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    suppressNextClickRef.current = false;
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
    endDrag(true);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    endDrag(false);
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      e.preventDefault();
      return;
    }
    triggerOpenDrawer();
  };

  if (!mounted) return null;

  return (
    <button
      id="mobile-fab-create-link"
      data-testid="mobile-fab-create-link"
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{
        touchAction: "none",
        willChange: "transform",
      }}
      className={`sm:hidden fixed bottom-6 right-4 z-[60] w-[50px] h-[50px] min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] rounded-full aspect-square flex items-center justify-center bg-[#0066FF] hover:bg-[#0052cc] text-white cursor-grab active:cursor-grabbing select-none shadow-md active:scale-95 transition-all shrink-0 ${
        isDragging ? "shadow-lg scale-105" : ""
      }`}
      title="Create Link"
      aria-label="Floating create link button"
    >
      <Link2 className="w-[22px] h-[22px] text-white stroke-[2.4] shrink-0 pointer-events-none" />
    </button>
  );
}
