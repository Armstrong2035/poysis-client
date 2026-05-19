"use client";

import { useState } from "react";
import { RegMarks } from "../chrome/reg-marks";
import { useActiveScene } from "../navigation/nav-context";

type Tier = {
  name: string;
  price: string;
  featured?: boolean;
  list: { text: string; dash?: boolean }[];
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    list: [
      { text: "25 docs" },
      { text: "30 day sync" },
      { text: "Drive only" },
      { text: "Claude + ChatGPT" },
      { text: "—", dash: true },
      { text: "Community support" },
    ],
  },
  {
    name: "Starter",
    price: "$5",
    featured: true,
    list: [
      { text: "300 docs" },
      { text: "1 year sync" },
      { text: "Drive only" },
      { text: "+ Slack + Telegram + Website" },
      { text: "Traces" },
      { text: "Email support" },
    ],
  },
  {
    name: "Pro",
    price: "$15",
    list: [
      { text: "Unlimited docs" },
      { text: "Full history" },
      { text: "Drive + Notion + Slack" },
      { text: "+ You tell us where" },
      { text: "Traces + Scoped copilots" },
      { text: "Priority support" },
    ],
  },
  {
    name: "Max",
    price: "$40",
    list: [
      { text: "Unlimited docs" },
      { text: "Full history" },
      { text: "All sources + Gmail" },
      { text: "+ Team sharing" },
      { text: "Named copilots + RBAC" },
      { text: "Dedicated support" },
    ],
  },
];

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
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isActive = useActiveScene() === "airlock";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!ok) {
      setError("Enter a valid email");
      return;
    }

    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) {
      setError("Signup is temporarily unavailable.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${workerUrl.replace(/\/+$/, "")}/waitlist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, source: "landing" }),
        },
      );

      if (res.status === 422) {
        setError("Enter a valid email");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Try again.");
        return;
      }

      // 200 covers both first-time and duplicate signups (idempotent on email).
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

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
            Join the waitlist. Be first to map your work.
          </p>

          {!submitted && (
            <div className="w-full flex flex-col gap-2.5 items-center">
              <form
                onSubmit={onSubmit}
                className="lv2-waitlist"
                autoComplete="off"
              >
                <input
                  id="airlock-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="lv2-waitlist__input"
                  placeholder="you@somewhere.com"
                  aria-label="Email"
                  required
                />
                <button
                  type="submit"
                  className="lv2-waitlist__btn"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Request early access →"}
                </button>
              </form>
              <div className="lv2-waitlist-error" role="alert">
                {error ?? ""}
              </div>
              <p className="lv2-form-meta">
                Starting with Google Drive · Free to start · No credit card required
              </p>
            </div>
          )}

          {submitted && (
            <div className="lv2-success">
              <div className="lv2-success__main">Your map is waiting.</div>
              <div className="lv2-success__sub">
                We&apos;ll reach out when it&apos;s ready.
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div id="airlock-pricing" className="lv2-pricing">
          <div className="lv2-pricing__head">
            <div className="lv2-pricing__title">Pricing</div>
            <div className="lv2-eyebrow lv2-eyebrow--dim">
              Tiers · USD / month
            </div>
          </div>
          <div className="lv2-pricing__grid">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`lv2-tier${tier.featured ? " lv2-tier--featured" : ""}`}
              >
                {tier.featured && (
                  <span className="lv2-tier__flag">Featured</span>
                )}
                <div className="lv2-tier__name">{tier.name}</div>
                <div className="lv2-tier__price">
                  {tier.price}
                  <span className="lv2-tier__per">/mo</span>
                </div>
                <ul className="lv2-tier__list">
                  {tier.list.map((item, i) => (
                    <li
                      key={i}
                      className={item.dash ? "lv2-tier__list-dash" : ""}
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
