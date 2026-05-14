"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENES, type SceneId } from "./scenes";

/**
 * Scene navigation.
 *
 * Desktop (>=768px):
 *  - Wheel notch / arrow key / touch-swipe advances one scene.
 *  - scrollIntoView animates between sections.
 *  - IntersectionObserver syncs active scene when the user drags the scrollbar.
 *
 * Mobile (<768px):
 *  - Body scroll is locked (see landing-v2.css mobile rules). Scenes become
 *    fixed full-screen cards stacked via opacity (data-active).
 *  - Touch swipes switch scenes. Swipes that start inside a scrollable
 *    container (e.g. .lv2-airlock-inner) scroll the container natively and
 *    only switch scenes when the container is at its boundary in the
 *    direction of the swipe.
 *
 * Each scene must render with id={`scene-${id}`} and data-scene-id={id}.
 */

const LOCK_MS = 800;
const WHEEL_THRESHOLD = 8;
const TOUCH_THRESHOLD = 48;

function findScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function useSceneNav() {
  const [active, setActive] = useState<SceneId>("hook");
  const activeIdxRef = useRef(0);
  const lockedRef = useRef(false);

  const goToIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= SCENES.length) return;
    if (idx === activeIdxRef.current) return;
    if (lockedRef.current) return;

    const id = SCENES[idx].id;
    const el = document.getElementById(`scene-${id}`);
    if (!el) return;

    lockedRef.current = true;
    activeIdxRef.current = idx;
    setActive(id);

    const mobile = window.innerWidth < 768;
    if (!mobile) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.setTimeout(() => {
      lockedRef.current = false;
    }, LOCK_MS);
  }, []);

  const scrollToScene = useCallback(
    (id: SceneId) => {
      const idx = SCENES.findIndex((s) => s.id === id);
      if (idx >= 0) goToIndex(idx);
    },
    [goToIndex],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = () => window.innerWidth < 768;

    // --- Wheel (desktop only) ---
    const onWheel = (e: WheelEvent) => {
      if (isMobile()) return;
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      // Last scene (airlock) on desktop: let native scroll read through
      // its long content; only intercept wheel-up at its top to go back.
      const lastIdx = SCENES.length - 1;
      if (activeIdxRef.current === lastIdx) {
        const lastEl = document.getElementById(`scene-${SCENES[lastIdx].id}`);
        if (lastEl) {
          const rect = lastEl.getBoundingClientRect();
          const atTop = rect.top >= -2;
          const goingUp = e.deltaY < 0;
          if (goingUp && atTop) {
            e.preventDefault();
            if (lockedRef.current) return;
            goToIndex(lastIdx - 1);
          }
          return;
        }
      }

      e.preventDefault();
      if (lockedRef.current) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      goToIndex(activeIdxRef.current + dir);
    };

    // --- Keyboard ---
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goToIndex(activeIdxRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToIndex(activeIdxRef.current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goToIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToIndex(SCENES.length - 1);
      }
    };

    // --- Touch ---
    let touchStartY = 0;
    let touchTracking = false;
    let touchScrollEl: HTMLElement | null = null;
    let touchScrollStartTop = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchTracking = true;
      touchScrollEl = isMobile()
        ? findScrollableAncestor(e.target as HTMLElement)
        : null;
      touchScrollStartTop = touchScrollEl ? touchScrollEl.scrollTop : 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchTracking) return;
      touchTracking = false;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < TOUCH_THRESHOLD) return;

      // If the swipe happened inside a scrollable container on mobile,
      // only switch scenes when the container is at its boundary in
      // the direction of the swipe.
      if (touchScrollEl) {
        const el = touchScrollEl;
        if (dy > 0) {
          // Swipe up → next scene. Only if scrolled to bottom AND didn't move.
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          const moved = Math.abs(el.scrollTop - touchScrollStartTop) > 2;
          if (!atBottom || moved) return;
        } else {
          // Swipe down → previous scene. Only if at top AND didn't move.
          const atTop = el.scrollTop <= 1;
          const moved = Math.abs(el.scrollTop - touchScrollStartTop) > 2;
          if (!atTop || moved) return;
        }
      }

      const dir = dy > 0 ? 1 : -1;
      goToIndex(activeIdxRef.current + dir);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [goToIndex]);

  // Fallback: keep active in sync if scrollbar is dragged (desktop).
  useEffect(() => {
    const sections = SCENES.map((s) =>
      document.getElementById(`scene-${s.id}`),
    ).filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockedRef.current) return;
        if (window.innerWidth < 768) return;

        let best: { idx: number; ratio: number } | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.sceneId as
            | SceneId
            | undefined;
          if (!id) continue;
          const idx = SCENES.findIndex((s) => s.id === id);
          if (idx < 0) continue;
          if (!best || e.intersectionRatio > best.ratio) {
            best = { idx, ratio: e.intersectionRatio };
          }
        }
        if (best && best.idx !== activeIdxRef.current) {
          activeIdxRef.current = best.idx;
          setActive(SCENES[best.idx].id);
        }
      },
      {
        rootMargin: "-30% 0px -30% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return { active, scrollToScene };
}
