"use client";

import { ProductWindow } from "../chrome/product-window";
import { RegMarks } from "../chrome/reg-marks";
import { SceneShell } from "./scene-shell";

type ClusterProps = {
  count: number;
  label: React.ReactNode;
  left: string;
  top: string;
  size: number;
  focused?: boolean;
  mobileHide?: boolean;
};

function Cluster({
  count,
  label,
  left,
  top,
  size,
  focused,
  mobileHide,
}: ClusterProps) {
  const cls = [
    "lv2-cluster",
    focused ? "lv2-cluster--focus" : "",
    mobileHide ? "lv2-mobile-hide" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} style={{ left, top, width: size, height: size }}>
      {focused && (
        <>
          <span className="lv2-focus-bracket lv2-focus-bracket--tl" />
          <span className="lv2-focus-bracket lv2-focus-bracket--tr" />
          <span className="lv2-focus-bracket lv2-focus-bracket--bl" />
          <span className="lv2-focus-bracket lv2-focus-bracket--br" />
        </>
      )}
      <div>
        <span className="lv2-cluster__count">{count}</span>
        {label}
      </div>
    </div>
  );
}

export function SceneQuery() {
  return (
    <SceneShell id="query">
      <RegMarks />

      <div className="relative z-[4] w-full grid grid-cols-1 md:grid-cols-[42%_1fr] gap-10 md:gap-14 items-center px-5 md:px-16 pt-16 pb-12 md:pt-28 md:pb-28">
        {/* LEFT — copy column */}
        <div className="flex flex-col gap-6 md:gap-5 max-w-[460px]">
          <div className="lv2-eyebrow">02 · Query</div>
          <h3 className="lv2-h-medium">
            Talk to your knowledge from anywhere.
          </h3>
          <p className="lv2-body-md lv2-mobile-hide">
            Claude. ChatGPT. Slack. Telegram.
            <br />
            Wherever you work.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-2 lv2-mobile-hide">
            <span className="lv2-chip">Claude · MCP</span>
            <span className="lv2-chip">ChatGPT · MCP</span>
            <span className="lv2-chip">Slack</span>
            <span className="lv2-chip">Telegram</span>
          </div>
        </div>

        {/* RIGHT — map mockup */}
        <div>
          <ProductWindow label="02 Map · Cluster focus">
            <div className="lv2-map">
              <div className="lv2-map__head">
                <span className="lv2-map__scope lv2-mobile-hide">
                  Asking within Customer Research
                </span>
                <span className="lv2-map__confidence lv2-mobile-hide">
                  Confidence 94% · 47 sources
                </span>
                {/* Mobile-only "Query from" row, surfaced at the top of the demo */}
                <div className="lv2-query-from md:hidden">
                  <span className="lv2-query-from__label">Query from:</span>
                  <span className="lv2-chip lv2-chip--sm">Slack</span>
                  <span className="lv2-chip lv2-chip--sm">Claude</span>
                  <span className="lv2-chip lv2-chip--sm">ChatGPT</span>
                  <span className="lv2-chip lv2-chip--sm">Other</span>
                </div>
              </div>

              <div className="lv2-map__canvas">
                {/* Focused cluster */}
                <Cluster
                  count={47}
                  label={
                    <>
                      Customer
                      <br />
                      Research
                    </>
                  }
                  left="38%"
                  top="32%"
                  size={130}
                  focused
                />
                {/* Peripheral clusters */}
                <Cluster
                  count={22}
                  label="Pricing"
                  left="8%"
                  top="14%"
                  size={70}
                />
                <Cluster
                  count={31}
                  label="Roadmap"
                  left="72%"
                  top="12%"
                  size={80}
                />
                <Cluster
                  count={14}
                  label="Hiring"
                  left="75%"
                  top="60%"
                  size={64}
                />
                <Cluster
                  count={19}
                  label="Design"
                  left="12%"
                  top="68%"
                  size={72}
                />
                <Cluster
                  count={9}
                  label="Legal"
                  left="44%"
                  top="78%"
                  size={60}
                />
              </div>

              <div className="lv2-cmd">
                <span className="lv2-cmd__label">
                  ▸ Asking within Customer Research
                </span>
                <div className="lv2-cmd__q">
                  What did we decide about pricing?
                  <span className="lv2-caret" />
                </div>
              </div>
            </div>
          </ProductWindow>
        </div>
      </div>
    </SceneShell>
  );
}
