"use client";

import { SCENES, type SceneId } from "./scenes";

type Props = {
  active: SceneId;
  onSelect: (id: SceneId) => void;
};

/**
 * Mobile-only floating bottom dot nav. Hidden on >=768px (CSS).
 * 7 dots matching SCENES; tap to jump to a scene.
 */
export function BottomNav({ active, onSelect }: Props) {
  return (
    <nav className="lv2-bottom-nav" aria-label="Scene navigation">
      {SCENES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`lv2-bottom-nav__dot${
            active === s.id ? " lv2-bottom-nav__dot--active" : ""
          }`}
          aria-label={`Go to ${s.label}`}
          aria-current={active === s.id ? "true" : undefined}
        />
      ))}
    </nav>
  );
}
