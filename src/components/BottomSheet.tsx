"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Height class, e.g. 'max-h-[45vh]' or 'max-h-[72vh]' */
  maxHeightClass?: string;
  /** Extra Tailwind classes on the sheet container */
  className?: string;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD_PX = 80;
const DISMISS_VELOCITY = 0.4; // px/ms — a fast flick

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  maxHeightClass = "max-h-[72vh]",
  className = "",
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    startY: number;
    startTime: number;
    currentY: number;
    dragging: boolean;
  } | null>(null);

  // Track whether the sheet has ever been opened so we can render + animate
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Mount on first open, then animate in
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Delay one frame so the DOM is painted at translateY(100%) first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      // Unmount after the exit animation completes
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const applyTranslate = useCallback((y: number) => {
    if (sheetRef.current) {
      // Only allow dragging downward (positive y)
      const clamped = Math.max(0, y);
      sheetRef.current.style.transform = `translateY(${clamped}px)`;
      // Fade the backdrop slightly as user drags down
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const resetTransform = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform = "";
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only initiate drag from the handle area (data-sheet-handle)
    const target = e.target as HTMLElement;
    if (!target.closest("[data-sheet-handle]")) return;

    dragState.current = {
      startY: e.clientY,
      startTime: Date.now(),
      currentY: e.clientY,
      dragging: true,
    };

    // Capture pointer so we get events even outside the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current?.dragging) return;
      dragState.current.currentY = e.clientY;
      const deltaY = e.clientY - dragState.current.startY;
      applyTranslate(deltaY);
    },
    [applyTranslate]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current?.dragging) return;

      const deltaY = e.clientY - dragState.current.startY;
      const elapsed = Date.now() - dragState.current.startTime;
      const velocity = deltaY / Math.max(1, elapsed); // px/ms

      dragState.current = null;

      if (deltaY > DISMISS_THRESHOLD_PX || velocity > DISMISS_VELOCITY) {
        // Dismiss: animate sheet fully off screen, then close
        if (sheetRef.current) {
          sheetRef.current.style.transition =
            "transform 350ms cubic-bezier(0.32, 0.72, 0, 1)";
          sheetRef.current.style.transform = "translateY(100%)";
        }
        setTimeout(() => {
          resetTransform();
          onClose();
        }, 350);
      } else {
        // Snap back
        resetTransform();
      }
    },
    [onClose, resetTransform]
  );

  // Don't render anything if not mounted
  if (!mounted) return null;

  return (
    <>
      {/* Scrim / backdrop overlay */}
      <div
        className={`fixed inset-0 z-[29] bg-black/10 transition-opacity duration-300 md:hidden ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <aside
        ref={sheetRef}
        aria-label="Panel Pabrik"
        className={`fixed inset-x-0 bottom-14 ${maxHeightClass} rounded-t-[32px]
          md:top-20 md:left-6 md:right-auto md:bottom-20 md:w-[420px]
          md:max-h-[calc(100vh-160px)] md:rounded-[28px]
          z-30 bg-white/95 backdrop-blur-xl border border-[#DDE7E2]
          shadow-[0_16px_48px_rgba(4,38,28,0.12)]
          overflow-hidden flex flex-col
          transition-transform duration-[400ms] will-change-transform
          ${visible ? "translate-y-0" : "translate-y-full md:translate-y-0 md:translate-x-[-120%]"}
          ${className}`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </aside>
    </>
  );
};

