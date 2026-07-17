"use client";

import { SCENES, type SceneId } from "./scenes";

type Props = {
  active: SceneId;
  onSelect: (id: SceneId) => void;
};

export function SideRail({ active, onSelect }: Props) {
  return (
    <nav className="lv2-rail" aria-label="Scene navigation">
      {SCENES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={`lv2-rail__dot${
            active === s.id ? " lv2-rail__dot--active" : ""
          }`}
          aria-label={`Go to ${s.label}`}
          aria-current={active === s.id ? "true" : undefined}
        />
      ))}
    </nav>
  );
}
