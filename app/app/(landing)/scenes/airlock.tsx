"use client";

import Link from "next/link";
import { RegMarks } from "../chrome/reg-marks";
import { useActiveScene } from "../navigation/nav-context";

const TRUST_OK = [
  "Encryption in transit and at rest",
  "Google OAuth with minimal scopes (drive.readonly)",
  "Permissions inheritance — if you can't open it in Drive, neither can Poysis",
  "You control what gets indexed",
  "PII scrubbing — emails, names, and personal identifiers stripped before indexing",
];

const TRUST_PROG = [
  "SOC 2 Type 1 — In progress",
  "GDPR compliance — In progress",
];

export function SceneAirlock() {
  const isActive = useActiveScene() === "airlock";

  return (
    <section
      id="scene-airlock"
      data-scene-id="airlock"
      data-active={isActive ? "true" : "false"}
      className="lv2-scene relative w-full min-h-screen"
    >
      <RegMarks />

      <div className="lv2-airlock-inner relative z-[4] w-full max-w-[1200px] mx-auto px-6 md:px-16 pt-16 pb-16 md:pt-32 md:pb-32">
        {/* CTA block — centered */}
        <div className="flex flex-col items-center gap-7 max-w-[720px] mx-auto text-center">
          <p className="lv2-closing-arg">
            Thousands of documents. Years of decisions.
            <br />
            Conversations that shaped your thinking.
            <br />
            All of it is yours. Poysis makes it feel like it.
          </p>

          <h2 className="lv2-airlock-headline">
            Your knowledge is already there.
            <br />
            Now <em>make it work</em>.
          </h2>

          <p className="lv2-subhead">
            Free to start. No credit card required.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link href="/signup" className="lv2-airlock-cta">
              Get started free →
            </Link>
            <Link href="/login" className="lv2-airlock-signin">
              Already have an account? Sign in →
            </Link>
          </div>

          <p className="lv2-form-meta">
            Starting with Google Drive · More sources coming soon
          </p>
        </div>

        {/* Trust */}
        <div className="lv2-trust">
          <div className="lv2-trust__head">
            <div className="lv2-trust__title">Trust</div>
            <div className="lv2-eyebrow lv2-eyebrow--dim">
              Security · Compliance
            </div>
          </div>
          <div className="lv2-trust__grid">
            {TRUST_OK.map((text) => (
              <div
                key={text}
                className="lv2-trust__item lv2-trust__item--ok"
              >
                <span className="lv2-trust__mark" />
                <span className="lv2-trust__item-text">{text}</span>
              </div>
            ))}
            {TRUST_PROG.map((text) => (
              <div
                key={text}
                className="lv2-trust__item lv2-trust__item--prog"
              >
                <span className="lv2-trust__mark" />
                <span className="lv2-trust__item-text">{text}</span>
              </div>
            ))}
          </div>
          <p className="lv2-trust__statement">
            We don&apos;t index your conversations. We capture only what you
            confirm worth keeping.
          </p>
        </div>
      </div>
    </section>
  );
}
