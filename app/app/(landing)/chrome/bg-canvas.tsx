"use client";

/**
 * Subtle starfield with slow parallax drift.
 * Honors prefers-reduced-motion (renders a static field).
 */

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number; // depth, 0..1
  size: number;
  twinkle: number;
};

export function BgCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let stars: Star[] = [];
    let raf = 0;
    let t = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      const density = Math.floor((window.innerWidth * window.innerHeight) / 9000);
      stars = Array.from({ length: density }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(),
        size: 0.4 + Math.random() * 1.4,
        twinkle: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // very faint amber radial wash
      const grd = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.7,
      );
      grd.addColorStop(0, "rgba(232,165,71,0.025)");
      grd.addColorStop(1, "rgba(10,11,15,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        const flicker = 0.55 + 0.45 * Math.sin(t * 0.6 + s.twinkle);
        const alpha = (0.15 + s.z * 0.55) * flicker;
        ctx.fillStyle = `rgba(232,233,237,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * dpr, 0, Math.PI * 2);
        ctx.fill();

        if (!reduce) {
          // very slow downward drift, faster for nearer stars
          s.y += 0.05 * s.z * dpr;
          if (s.y > canvas.height) {
            s.y = -2;
            s.x = Math.random() * canvas.width;
          }
        }
      }
    }

    function loop() {
      t += 0.016;
      draw();
      raf = requestAnimationFrame(loop);
    }

    resize();
    if (reduce) {
      draw();
    } else {
      loop();
    }
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="lv2-bg-canvas" aria-hidden="true" />;
}
