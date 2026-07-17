"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { SceneId } from "../navigation/scenes";
import { useActiveScene } from "../navigation/nav-context";

type Props = {
  id: SceneId;
  children: React.ReactNode;
  /** Some scenes (Reveal) want their inner glow to bleed across boundaries. */
  bleed?: boolean;
};

/**
 * Wraps a 100vh section.
 *
 * Desktop: Apple-style cinematic transitions driven by scrollYProgress
 * (fade in at viewport center, drift + dim out at edges).
 *
 * Mobile (<768px): scenes are stacked as fixed full-screen cards and
 * cross-fade via CSS keyed off data-active. Framer-motion transforms are
 * skipped because page scroll is locked and the inner motion values would
 * pin to misleading positions.
 */
export function SceneShell({ id, children, bleed = false }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const activeScene = useActiveScene();
  const isActive = activeScene === id;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.88, 1],
    [0, 1, 1, 0],
  );
  const y = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [20, 0, 0, -20]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.12, 0.88, 1],
    [0.99, 1, 1, 1.005],
  );

  return (
    <section
      ref={ref}
      id={`scene-${id}`}
      data-scene-id={id}
      data-active={isActive ? "true" : "false"}
      className="lv2-scene relative w-full min-h-screen flex items-stretch"
      style={isMobile ? undefined : { overflow: bleed ? "visible" : "hidden" }}
      aria-hidden={isMobile && !isActive ? "true" : undefined}
    >
      <motion.div
        style={
          isMobile ? { opacity: 1, y: 0, scale: 1 } : { opacity, y, scale }
        }
        className="motion-safe:will-change-transform flex w-full"
      >
        {children}
      </motion.div>
    </section>
  );
}
