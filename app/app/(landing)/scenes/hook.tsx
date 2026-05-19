"use client";

import { DebrisField } from "../chrome/debris-field";
import { RegMarks } from "../chrome/reg-marks";
import { SceneShell } from "./scene-shell";

export function SceneHook() {
  return (
    <SceneShell id="hook">
      {/* Per-scene debris, dialed down */}
      <DebrisField seed={11} density={14} />
      <RegMarks />

      {/* Left column, vertically centered */}
      <div className="relative z-[4] w-full flex items-center px-6 md:pl-16 md:pr-8 pt-16 pb-12 md:pt-28 md:pb-28">
        <div className="w-full md:w-[42%] flex flex-col gap-9 md:gap-7">
          <h1 className="lv2-h-hook">
            Across your notes, files, and chats is a trail of your best ideas.
          </h1>

          <h1 className="lv2-h-hook lv2-h-hook--amber">
            Right now, they’re scattered everywhere.
          </h1>

          <div className="lv2-scroll-prompt lv2-scroll-prompt-anim mt-6">
            ↓&nbsp;&nbsp;Look closer
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
