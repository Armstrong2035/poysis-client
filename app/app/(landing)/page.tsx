"use client";

import { BgCanvas } from "./chrome/bg-canvas";
import { FilmStrips } from "./chrome/film-strips";
import { HudBottom, HudTop } from "./chrome/hud";
import { GridOverlay, Scanlines } from "./chrome/overlays";
import { BottomNav } from "./navigation/bottom-nav";
import { SceneNavProvider } from "./navigation/nav-context";
import { SideRail } from "./navigation/side-rail";
import { useSceneNav } from "./navigation/use-scene-nav";
import { SceneHook } from "./scenes/hook";
import { SceneWound } from "./scenes/wound";
import { SceneReveal } from "./scenes/reveal";
import { SceneConsolidate } from "./scenes/consolidate";
import { SceneQuery } from "./scenes/query";
import { SceneBuild } from "./scenes/build";
import { SceneAirlock } from "./scenes/airlock";

export default function LandingV2Page() {
  const { active, scrollToScene } = useSceneNav();

  return (
    <SceneNavProvider value={{ active }}>
      {/* Persistent chrome (z-stack: canvas 0 → grid 1 → scanlines 2 → scenes 3+ → hud 40 → rail 45 → film strips 50) */}
      <BgCanvas />
      <GridOverlay />
      <Scanlines />

      <FilmStrips />
      <HudTop
        active={active}
        onNav={scrollToScene}
      />
      {/* <HudBottom /> */}

      <SideRail active={active} onSelect={scrollToScene} />
      <BottomNav active={active} onSelect={scrollToScene} />

      <main className="relative z-[3]">
        <SceneHook />
        <SceneWound />
        <SceneReveal />
        <SceneConsolidate />
        <SceneQuery />
        <SceneBuild />
        <SceneAirlock />
      </main>
    </SceneNavProvider>
  );
}
