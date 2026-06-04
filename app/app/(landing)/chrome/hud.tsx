"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SceneId } from "../navigation/scenes";
import { Logo } from "@/components/Logo";

const FEATURE_IDS: SceneId[] = ["consolidate", "query", "build"];

const FEATURE_ITEMS: {
  id: SceneId;
  num: string;
  title: string;
  tag: string;
}[] = [
  {
    id: "consolidate",
    num: "01",
    title: "Consolidate",
    tag: "Connect your sources",
  },
  {
    id: "query",
    num: "02",
    title: "Query",
    tag: "Ask about anything you know",
  },
  {
    id: "build",
    num: "03",
    title: "Build",
    tag: "Put your knowledge to work",
  },
];

type HudTopProps = {
  active?: SceneId;
  onNav?: (id: SceneId) => void;
};

function FeaturesMenu({
  active,
  onNav,
}: {
  active?: SceneId;
  onNav?: (id: SceneId) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isFeatureActive = !!active && FEATURE_IDS.includes(active);

  // Close on escape + outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="lv2-hud__features"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`lv2-hud__navlink${
          isFeatureActive ? " lv2-hud__navlink--active" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Features {open ? "▴" : "▾"}
      </button>

      {open && (
        <div className="lv2-hud__dropdown" role="menu">
          {FEATURE_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onNav?.(item.id);
                setOpen(false);
              }}
              className={`lv2-feature${
                active === item.id ? " lv2-feature--active" : ""
              }`}
            >
              <span className="lv2-feature__num">{item.num}</span>
              <span className="lv2-feature__body">
                <span className="lv2-feature__title">{item.title}</span>
                <span className="lv2-feature__tag">{item.tag}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HudTop({ active, onNav }: HudTopProps) {
  return (
    <header className="lv2-hud lv2-hud--top">
      <Logo size="sm" />

      <nav className="lv2-hud__nav" aria-label="Section navigation">
        <FeaturesMenu active={active} onNav={onNav} />
      </nav>

      <div className="lv2-hud__right">
        <span className="lv2-hud__tag">Memory Infrastructure</span>
        <Link href="/login" className="lv2-hud__navlink">
          Sign in
        </Link>
        <Link href="/signup" className="lv2-join-btn">
          Get started →
        </Link>
      </div>
    </header>
  );
}

export function HudBottom() {
  const [flicker, setFlicker] = useState("2");
  useEffect(() => {
    const t = setInterval(() => {
      const next = Math.floor(Math.random() * 9).toString();
      setFlicker(next);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="lv2-hud lv2-hud--bottom">
      <span>Poysis · Bezalel Labs · Lagos, Nigeria</span>
      <span className="lv2-hud__center">
        06.5244°&nbsp;N&nbsp; 003.379
        <span className="lv2-coord-flicker">{flicker}</span>°&nbsp;E
      </span>
      <span>© 2026 · All rights reserved</span>
    </footer>
  );
}
