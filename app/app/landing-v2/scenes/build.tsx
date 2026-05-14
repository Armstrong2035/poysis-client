"use client";

import { ProductWindow } from "../chrome/product-window";
import { RegMarks } from "../chrome/reg-marks";
import { SceneShell } from "./scene-shell";

type CardProps = {
  observed: string;
  suggestion: string;
  use: string;
  fade?: boolean;
  mobileHide?: boolean;
};

function SuggestionCard({
  observed,
  suggestion,
  use,
  fade,
  mobileHide,
}: CardProps) {
  const cls = [
    "lv2-card",
    fade ? "lv2-card--fade" : "",
    mobileHide ? "lv2-mobile-hide" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls}>
      <div className="lv2-card__obs">{observed}</div>
      <div className="lv2-card__sugg">{suggestion}</div>
      <div className="lv2-card__use">{use}</div>
      <div className="lv2-card__row">
        <div className="lv2-card__cta">Build without writing any code →</div>
        <div className="lv2-card__time">Set up in under 5 minutes</div>
      </div>
    </div>
  );
}

export function SceneBuild() {
  return (
    <SceneShell id="build">
      <RegMarks />

      <div className="relative z-[4] w-full grid grid-cols-1 md:grid-cols-[42%_1fr] gap-7 md:gap-14 items-center px-5 md:px-16 pt-16 pb-12 md:pt-28 md:pb-28">
        {/* LEFT — copy column */}
        <div className="flex flex-col gap-6 md:gap-5 max-w-[460px]">
          <div className="lv2-eyebrow">03 · Build</div>
          <h3 className="lv2-h-medium">Put your knowledge to work.</h3>
          <p className="lv2-body-md lv2-mobile-hide">
            Build internal or public copilots from what you already know.
          </p>

          {/* Mobile-only condensed copy — replaces the body line + callout below */}
          <p className="lv2-body-md md:hidden">
            Poysis watches your footprint and surfaces co-pilots that you could
            build from it.
          </p>

          <div className="lv2-ouroboros lv2-mobile-hide">
            <div className="lv2-ouroboros__label">
              Ouroboros · Proactive Intelligence
            </div>
            <div className="lv2-ouroboros__body">
              Poysis watches your footprint and surfaces what you could build
              from it.
            </div>
          </div>
        </div>

        {/* RIGHT — suggestions mockup */}
        <div>
          <ProductWindow label="03 Build · Suggestions">
            <div className="flex flex-col gap-2.5">
              <div className="lv2-build-head">
                <div className="lv2-build-title">What you could build</div>
                <div className="lv2-build-meta">03 / Active</div>
              </div>

              <SuggestionCard
                observed="Observed · 47 docs in Customer Research"
                suggestion="A copilot that answers product questions in your voice."
                use="For your team's #ask-product channel."
              />
              <SuggestionCard
                observed="Observed · 12 essays on agentic memory"
                suggestion="A public bot that explains your essays to readers."
                use="Embed on your site or share a link."
              />
              <SuggestionCard
                observed="Observed · 8 hiring decisions in 2025"
                suggestion="A private copilot for interviewing."
                use="Briefs candidates against your past hires."
                fade
                mobileHide
              />
            </div>
          </ProductWindow>
        </div>
      </div>
    </SceneShell>
  );
}
