function NoiseCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="poy-noise relative flex-1 overflow-hidden rounded-[28px] bg-[#2E3A2A] p-6 shadow-[0_44px_100px_-50px_rgba(38,41,34,0.6)] sm:p-[30px]">
      <div className="relative">{children}</div>
    </div>
  );
}

function SourcesPanel() {
  const rows = [
    { label: "Google Drive", color: "#C9985C" },
    { label: "YouTube", color: "#C77B6F" },
    { label: "Notion", color: "#849F7A" },
    { label: "Claude & ChatGPT", color: "#C9985C" },
  ];
  return (
    <NoiseCard>
      <div className="mb-5 flex items-center justify-between">
        <span className="font-serif text-[18px] font-semibold text-[#F5F0E4] sm:text-[19px]">
          Your sources
        </span>
        <span className="text-[13px] text-[rgba(233,220,197,0.6)]">6 connected</span>
      </div>
      <div className="flex flex-col gap-[10px]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 rounded-[14px] border border-[rgba(242,238,226,0.12)] bg-[rgba(242,238,226,0.06)] px-4 py-[13px]"
          >
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: r.color }} />
            <span className="flex-1 text-[14px] text-[#EDE7D8] sm:text-[15px]">{r.label}</span>
            <span className="text-[12px] font-semibold text-[#9DBE90]">Synced</span>
          </div>
        ))}
      </div>
      <div className="mt-[14px] flex items-center gap-3 rounded-[14px] bg-[rgba(201,152,92,0.16)] px-4 py-[15px]">
        <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[#E0A968]" />
        <span className="text-[13px] text-[#F5F0E4] sm:text-[14px]">
          <strong className="font-bold">1,500 documents</strong> · one knowledge base
        </span>
      </div>
    </NoiseCard>
  );
}

function AskPanel() {
  return (
    <NoiseCard>
      <div className="mb-[18px] flex items-center gap-3 rounded-full bg-[#F6F1F0] py-[13px] pl-5 pr-[13px]">
        <span className="flex-1 font-serif text-[14px] italic text-[#3C4A3A] sm:text-[16px]">
          What did I decide about pricing last spring?
        </span>
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#3C4A3A] text-[15px] text-[#F2EEE2]">
          →
        </span>
      </div>
      <div className="rounded-[18px] border border-[rgba(242,238,226,0.12)] bg-[rgba(242,238,226,0.06)] p-5">
        <p className="text-[14px] leading-[1.6] text-[#EDE7D8] sm:text-[15px]">
          You landed on usage-based tiers after the March workshop — anchored to seats, with a
          volume discount above 50.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,152,92,0.3)] bg-[rgba(201,152,92,0.16)] px-[13px] py-[7px]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#E0A968]" />
          <span className="text-[12px] text-[#EDD9BC]">Pricing workshop · Mar 2025</span>
        </div>
      </div>
      <p className="mt-4 text-center text-[12px] text-[rgba(233,220,197,0.5)]">
        Reasoned across Poysis · Claude · ChatGPT
      </p>
    </NoiseCard>
  );
}

function BotsPanel() {
  const bots = [
    { label: "Personal", sub: "Just for you", chip: "#849F7A" },
    { label: "Team", sub: "7 members", chip: "#C9985C" },
    { label: "Clients", sub: "Invite-only", chip: "#C77B6F" },
  ];
  return (
    <NoiseCard>
      <div className="mb-5 flex items-center justify-between">
        <span className="font-serif text-[18px] font-semibold text-[#F5F0E4] sm:text-[19px]">
          Your knowledge bots
        </span>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[rgba(242,238,226,0.12)] text-[18px] text-[#F5F0E4]">
          +
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {bots.map((b) => (
          <div
            key={b.label}
            className="rounded-2xl border border-[rgba(242,238,226,0.12)] bg-[rgba(242,238,226,0.06)] p-[18px]"
          >
            <span
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px]"
              style={{ background: `${b.chip}4d` }}
            >
              <span className="h-[9px] w-[9px] rounded-full" style={{ background: b.chip }} />
            </span>
            <p className="mb-1 mt-[14px] text-[14px] font-semibold text-[#F5F0E4] sm:text-[15px]">
              {b.label}
            </p>
            <p className="text-[12px] text-[rgba(233,220,197,0.55)]">{b.sub}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-[rgba(224,169,104,0.34)] bg-[rgba(224,169,104,0.14)] p-[18px]">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[rgba(224,169,104,0.4)]">
            <span className="h-[9px] w-[9px] rounded-full bg-[#E0A968]" />
          </span>
          <p className="mb-1 mt-[14px] text-[14px] font-semibold text-[#F5F0E4] sm:text-[15px]">
            Public
          </p>
          <p className="flex items-center gap-[6px] text-[12px] text-[#EDD9BC]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#9DBE90]" />
            Live
          </p>
        </div>
      </div>
    </NoiseCard>
  );
}

const STEPS = [
  {
    num: "01 — Connect",
    numColor: "text-[#849F7A]",
    title: "Connect.",
    copy: "Your documents, videos, notes, and bookmarks become one connected knowledge base.",
    reverse: false,
    panel: <SourcesPanel />,
  },
  {
    num: "02 — Ask",
    numColor: "text-[#C9985C]",
    title: "Ask.",
    copy: "Search, brainstorm, and reason across everything you've ever created — from Poysis, Claude, or ChatGPT.",
    reverse: true,
    panel: <AskPanel />,
  },
  {
    num: "03 — Build",
    numColor: "text-[#7E3A33]",
    title: "Build.",
    copy: "Create knowledge bots for yourself, your team, your clients, or the world. Every answer stays grounded in your knowledge.",
    reverse: false,
    panel: <BotsPanel />,
  },
];

export function HowItWorks() {
  return (
    <div id="how-it-works" className="bg-[#F2EEE2] px-5 pb-10 pt-20 sm:px-10 sm:pt-24 lg:px-[60px] lg:pt-[120px]">
      <div className="mx-auto mb-6 max-w-[640px] text-center">
        <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#C9985C]">
          How it works
        </span>
        <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.6px] text-[#262922] sm:text-[42px] lg:text-[52px] lg:leading-[1.08] lg:tracking-[-1.2px]">
          Three steps to a mind <span className="italic">that remembers</span>.
        </h2>
      </div>

      <div className="mx-auto max-w-[1180px]">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className={`flex flex-col items-center gap-10 py-12 sm:py-16 lg:flex-row lg:gap-[76px] ${
              step.reverse ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="w-full flex-1">
              <span className={`text-[13px] font-semibold tracking-[2px] ${step.numColor}`}>
                {step.num}
              </span>
              <h3 className="mt-3 font-serif text-[38px] font-medium leading-[1.05] tracking-[-0.8px] text-[#262922] sm:text-[46px] lg:text-[52px] lg:tracking-[-1.2px]">
                {step.title}
              </h3>
              <p className="mt-5 max-w-[420px] text-[17px] leading-[1.6] text-[#55594D] sm:text-[20px]">
                {step.copy}
              </p>
            </div>
            <div className="w-full flex-1">{step.panel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
