"use client";

import { ProductWindow } from "../chrome/product-window";
import { RegMarks } from "../chrome/reg-marks";
import { SceneShell } from "./scene-shell";

export function SceneConsolidate() {
  return (
    <SceneShell id="consolidate">
      <RegMarks />

      <div className="relative z-[4] w-full grid grid-cols-1 md:grid-cols-[42%_1fr] gap-7 md:gap-14 items-center px-5 md:px-16 pt-16 pb-12 md:pt-28 md:pb-28">
        {/* LEFT — copy column */}
        <div className="flex flex-col gap-6 md:gap-5 max-w-[460px]">
          <div className="lv2-eyebrow">01 · Consolidate</div>
          <h3 className="lv2-h-medium">Connect your sources.</h3>
          <p className="lv2-body-md">
            Poysis shows you what you actually know.
          </p>
          <p className="lv2-body-sm">
            Connect Google Drive. Watch your knowledge organize itself into a
            map of named territories.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-2">
            <span className="lv2-chip lv2-chip--live">Google Drive · Live</span>
            <span className="lv2-chip">Notion</span>
            <span className="lv2-chip">Slack</span>
            <span className="lv2-chip lv2-chip--more">+ More weekly</span>
          </div>
        </div>

        {/* RIGHT — product window mockup */}
        <ProductWindow label="01 Connect · Step 01/03">
          <div className="flex flex-col gap-4 pt-1">
            <div className="lv2-ph-crumb">Step 01 / 03 · Connect a source</div>
            <div className="lv2-ph-title">Where does your work live?</div>
            <div className="lv2-ph-sub">
              Start with one source. We&apos;ll find the rest.
            </div>

            <div className="lv2-bigbtn">
              <div className="lv2-bigbtn__icon">G</div>
              <div className="lv2-bigbtn__txt">Connect Google Drive</div>
              <div className="lv2-bigbtn__meta">Live</div>
            </div>

            <div className="flex flex-wrap gap-2 mt-1 lv2-mobile-hide">
              <span className="lv2-chip">Notion · Soon</span>
              <span className="lv2-chip">Slack · Soon</span>
              <span className="lv2-chip">Gmail · Soon</span>
              <span className="lv2-chip">Linear · Soon</span>
            </div>

            <div className="lv2-input-line lv2-mobile-hide">
              <span className="lv2-input-line__placeholder">
                Suggest a source…
              </span>
              <span className="lv2-input-line__btn">Send →</span>
            </div>

            <div className="lv2-promise lv2-mobile-hide">
              We ship new integrations within a week of you asking.
            </div>
          </div>
        </ProductWindow>
      </div>
    </SceneShell>
  );
}
