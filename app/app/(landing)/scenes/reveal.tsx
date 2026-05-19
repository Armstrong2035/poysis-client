"use client";

import { motion } from "framer-motion";
import { RegMarks } from "../chrome/reg-marks";
import { StationCluster } from "../chrome/station-cluster";
import { SceneShell } from "./scene-shell";

export function SceneReveal() {
  return (
    <SceneShell id="reveal" bleed>
      {/* Background atmospherics — sit behind the content */}
      <div className="lv2-station-glow" aria-hidden="true" />
      <StationCluster />
      <RegMarks />

      {/* Centered content — deliberate break from the left-column rhythm */}
      <div className="relative z-[4] w-full flex items-center justify-center px-6 pt-16 pb-12 md:pt-28 md:pb-28">
        <div className="flex flex-col items-center gap-8 md:gap-6 text-center max-w-[820px]">
          <motion.div
            className="lv2-reveal-headline"
            initial={{
              textShadow: "0 0 0px rgba(232,165,71,0)",
              opacity: 0.9,
            }}
            whileInView={{
              textShadow: [
                "0 0 0px rgba(232,165,71,0)",
                "0 0 32px rgba(232,165,71,0.6)",
                "0 0 18px rgba(232,165,71,0.28)",
              ],
              opacity: 1,
            }}
            viewport={{ amount: 0.5, once: false }}
            transition={{ duration: 2.2, ease: "easeOut", times: [0, 0.4, 1] }}
          >
            They can.
          </motion.div>

          <div className="lv2-h-section">This is Poysis.</div>

          <p className="lv2-body-md lv2-body-italic max-w-[620px]">
            Poysis organizes your ideas, notes, and past work — no matter where
            you stored them.
          </p>

          <p className="lv2-body-md max-w-[540px]">
            Then, it provides context to ChatGPT, Claude, Slack, and wherever
            you already work.
          </p>
        </div>
      </div>
    </SceneShell>
  );
}
