import { Logo } from "@/components/Logo";

const CALENDLY_URL = "#"; // TODO: replace with Calendly link

const BORDER = "1px solid rgba(58, 61, 71, 0.4)";
const SURFACE = "rgba(20, 22, 29, 0.45)";

export default function EnterprisePage() {
  return (
    <>
      <div className="lv2-grid-overlay" aria-hidden />

      {/* Nav */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-8"
        style={{
          height: 64,
          background: "rgba(10, 11, 15, 0.92)",
          backdropFilter: "saturate(140%) blur(14px)",
          WebkitBackdropFilter: "saturate(140%) blur(14px)",
          borderBottom: "1px solid rgba(58, 61, 71, 0.25)",
        }}
      >
        <Logo variant="dark" size="md" />
        <a href={CALENDLY_URL} className="lv2-join-btn">
          Request a Demo →
        </a>
      </header>

      <main style={{ paddingTop: 64 }}>

        {/* ── Hero ── */}
        <section className="flex items-center px-6 md:px-8 py-20 md:py-28 max-w-[1200px] mx-auto min-h-[88vh]">
          <div className="max-w-[700px]">
            <p className="lv2-eyebrow mb-6">Enterprise</p>
            <h1 className="lv2-h-medium mb-7">
              Make better decisions with everything your organization knows.
            </h1>
            <p className="lv2-body-md max-w-[540px] mb-4">
              Poysis helps teams turn scattered knowledge across documents, emails, conversations, and prior work into clear, actionable context for any decision.
            </p>
            <p className="lv2-body-md max-w-[540px] mb-12">
              State your research goal. Get a synthesized brief built from your organization&apos;s collective knowledge.
            </p>
            <a href={CALENDLY_URL} className="lv2-airlock-cta">
              Request a Demo →
            </a>
          </div>
        </section>

        {/* ── Problem ── */}
        <section
          className="px-6 md:px-8 py-24 max-w-[1200px] mx-auto"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <p className="lv2-eyebrow mb-8">The Problem</p>
          <h2 className="lv2-h-medium max-w-[640px] mb-10">
            Organizations are not short on knowledge.{" "}
            <span className="lv2-h-medium--amber">
              They&apos;re short on context.
            </span>
          </h2>
          <div className="max-w-[560px] flex flex-col gap-5">
            <p className="lv2-body-md">
              Every day, teams make decisions while the information they need is
              scattered across documents, emails, chats, and the minds of colleagues.
            </p>
            <p className="lv2-body-md">
              As organizations grow, knowledge becomes fragmented. Decisions take
              longer. Research gets done from scratch. Valuable experience goes unused.
            </p>
            <p
              className="lv2-body-md lv2-body-italic"
              style={{
                borderLeft: "2px solid rgba(232, 165, 71, 0.4)",
                paddingLeft: 18,
                color: "var(--bone)",
                fontStyle: "italic",
              }}
            >
              The problem isn&apos;t finding information. It&apos;s reconstructing
              the context needed to make a decision.
            </p>
          </div>
        </section>

        {/* ── Before vs With Poysis ── */}
        <section
          className="px-6 md:px-8 py-24"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <p className="lv2-eyebrow mb-12">Before vs. With Poysis</p>
            <div className="grid md:grid-cols-2 gap-5">

              {/* Before */}
              <div
                className="p-9"
                style={{ border: "1px solid rgba(58, 61, 71, 0.5)", background: SURFACE }}
              >
                <p
                  className="lv2-mono mb-6"
                  style={{
                    fontSize: 11,
                    color: "var(--light-gray)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                  }}
                >
                  Before Poysis
                </p>
                <ul className="flex flex-col gap-4 list-none p-0 m-0">
                  {[
                    "Endless keyword searching across disconnected silos",
                    "Interrupting colleagues to ask, \"Why did we build it this way?\"",
                    "Repeat research that has already been done",
                  ].map((item) => (
                    <li key={item} className="lv2-body-md flex items-start gap-3">
                      <span style={{ color: "var(--mid-gray)", marginTop: 2, flexShrink: 0 }}>
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* With Poysis */}
              <div
                className="p-9"
                style={{
                  border: "1px solid rgba(232, 165, 71, 0.3)",
                  background:
                    "linear-gradient(180deg, rgba(232, 165, 71, 0.05) 0%, transparent 60%), rgba(20, 22, 29, 0.5)",
                }}
              >
                <p
                  className="lv2-mono mb-6"
                  style={{
                    fontSize: 11,
                    color: "var(--forge)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    opacity: 0.85,
                  }}
                >
                  With Poysis
                </p>
                <ul className="flex flex-col gap-4 list-none p-0 m-0">
                  {[
                    "State your objective — a report, client brief, or pitch",
                    "Instantly assemble relevant context",
                    "Surface prior decisions, reasoning, and work",
                    "Build on past momentum, instantly",
                  ].map((item) => (
                    <li key={item} className="lv2-body-md flex items-start gap-3">
                      <span style={{ color: "var(--forge)", marginTop: 2, flexShrink: 0 }}>
                        →
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* ── What Poysis Produces ── */}
        <section
          className="px-6 md:px-8 py-24"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-start">
            <div>
              <p className="lv2-eyebrow mb-6">The Output</p>
              <h2 className="lv2-h-hook mb-6">
                Every research goal produces a structured brief.
              </h2>
              <p className="lv2-body-md">
                Instead of a list of documents, Poysis assembles a synthesized view
                of what your organization already knows about the topic.
              </p>
            </div>
            <div>
              {[
                { n: "01", text: "Relevant prior work" },
                { n: "02", text: "Key decisions and their rationale" },
                { n: "03", text: "Supporting evidence and source material" },
                { n: "04", text: "Related projects and conversations" },
                { n: "05", text: "Open questions and knowledge gaps" },
              ].map((item) => (
                <div
                  key={item.n}
                  className="flex items-center gap-5 py-4"
                  style={{ borderBottom: "1px solid rgba(58, 61, 71, 0.25)" }}
                >
                  <span
                    className="lv2-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--forge)",
                      letterSpacing: "0.18em",
                      opacity: 0.65,
                      flexShrink: 0,
                      minWidth: 28,
                    }}
                  >
                    {item.n}
                  </span>
                  <span className="lv2-body-md" style={{ color: "var(--bone)" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Example Research Goals ── */}
        <section
          className="px-6 md:px-8 py-24"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <p className="lv2-eyebrow mb-4">Examples</p>
            <h2 className="lv2-h-hook mb-14 max-w-[480px]">
              State your research goal in plain language.
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                "Prepare a client brief on renewable energy investments.",
                "Understand why we chose this architecture.",
                "Summarize everything we know about Acme Corp.",
                "Create an onboarding brief for new team members.",
                "Review prior work before writing this proposal.",
                "Research similar cases handled by our firm.",
              ].map((goal) => (
                <div
                  key={goal}
                  className="p-6"
                  style={{ border: BORDER, background: SURFACE }}
                >
                  <span className="lv2-eyebrow block mb-3" style={{ opacity: 0.65 }}>
                    Research Goal
                  </span>
                  <p
                    className="lv2-body-md"
                    style={{ color: "var(--bone)", fontStyle: "italic" }}
                  >
                    &ldquo;{goal}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section
          className="px-6 md:px-8 py-24"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <div className="max-w-[1200px] mx-auto">
            <p className="lv2-eyebrow mb-4">How It Works</p>
            <h2 className="lv2-h-hook mb-16 max-w-[400px]">
              Three steps. That&apos;s it.
            </h2>
            <div className="flex flex-col md:flex-row">
              {[
                {
                  n: "01",
                  title: "Connect your knowledge sources",
                  body: "Documents, emails, conversations, prior work — connect the knowledge your organization already has.",
                },
                {
                  n: "02",
                  title: "State your research goal",
                  body: "Describe what you're trying to decide or understand. No special syntax — plain language works.",
                },
                {
                  n: "03",
                  title: "Receive a synthesized brief",
                  body: "Poysis assembles everything relevant into a structured brief. Prior decisions, evidence, open questions — ready to act on.",
                },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className="flex-1 p-10"
                  style={{
                    border: BORDER,
                    marginLeft: i > 0 ? -1 : 0,
                    marginTop: i > 0 ? -1 : 0,
                  }}
                >
                  <span
                    className="lv2-mono block mb-6"
                    style={{
                      fontSize: 28,
                      color: "var(--forge)",
                      opacity: 0.28,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.n}
                  </span>
                  <h3
                    className="lv2-display mb-3"
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "var(--bone)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="lv2-body-md">{step.body}</p>
                </div>
              ))}
            </div>
            <p
              className="lv2-body-md lv2-body-italic mt-8"
              style={{ opacity: 0.6, fontStyle: "italic" }}
            >
              Poysis continuously transforms organizational knowledge into decision-ready context.
            </p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          className="px-6 md:px-8 py-32 text-center"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <p className="lv2-eyebrow mb-8">Get Started</p>
          <h2 className="lv2-airlock-headline mb-4">
            Stop rebuilding context from scratch.
          </h2>
          <p className="lv2-subhead mb-12">
            Start making decisions with everything your organization already knows.
          </p>
          <a href={CALENDLY_URL} className="lv2-airlock-cta">
            Request a Demo →
          </a>
        </section>

        {/* Footer */}
        <footer
          className="px-6 md:px-8 py-6 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(58, 61, 71, 0.25)" }}
        >
          <Logo variant="dark" size="sm" />
          <span
            className="lv2-mono"
            style={{
              fontSize: 10,
              color: "var(--mid-gray)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            © 2025 Poysis
          </span>
        </footer>

      </main>
    </>
  );
}
