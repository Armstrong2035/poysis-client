"use client";

import { DebrisField } from "../chrome/debris-field";
import { RegMarks } from "../chrome/reg-marks";
import { SceneShell } from "./scene-shell";

export function SceneWound() {
  return (
    <SceneShell id="wound">
      {/* Different seed so the field doesn't mirror Scene 1 */}
      <DebrisField seed={29} density={14} />
      <RegMarks />

      {/* Left column, vertically centered — mirrors Scene 1 for rhythm */}
      <div className="relative z-[4] w-full flex items-center px-6 md:pl-16 md:pr-8 pt-16 pb-12 md:pt-28 md:pb-28">
        <div className="w-full md:w-[42%] flex flex-col gap-9 md:gap-7">
          <p className="lv2-body-md max-w-[540px]">
            All that knowledge stored across your tools.
          </p>

          <h2 className="lv2-h-medium">
            Why does finding what you need have to be a puzzle?
          </h2>
          <h2 className="lv2-h-medium lv2-h-medium--amber">
            Why can’t the tools you already use remember for you?
          </h2>
        </div>
      </div>
    </SceneShell>
  );
}
