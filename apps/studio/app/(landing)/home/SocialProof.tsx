const AUDIENCE_CHIPS = [
  { label: "Founders", style: "bg-[#C9985C] text-[#2C2416] font-semibold" },
  { label: "Law Firms", style: "border border-[rgba(242,238,226,0.34)] text-[#F2EEE2]" },
  { label: "Consultants", style: "bg-[#849F7A] text-[#22301F] font-semibold" },
  { label: "Pastors", style: "border border-[rgba(242,238,226,0.34)] text-[#F2EEE2]" },
  { label: "Thought Leaders", style: "bg-[#7E3A33] text-[#F2EEE2] font-semibold" },
  { label: "Teachers", style: "border border-[rgba(242,238,226,0.34)] text-[#F2EEE2]" },
  { label: "Solo Operators", style: "border border-[rgba(242,238,226,0.34)] text-[#F2EEE2]" },
];

const SOURCES = [
  { label: "Google Drive", color: "#C9985C" },
  { label: "YouTube", color: "#C77B6F" },
  { label: "Notion", color: "#849F7A" },
  { label: "Claude", color: "#C9985C" },
  { label: "ChatGPT", color: "#C77B6F" },
  { label: "Slack", color: "#849F7A" },
  { label: "Social bookmarks", color: "#C9985C" },
];

function SourceChip({ label, color }: { label: string; color: string }) {
  return (
    <div className="mx-[9px] flex items-center gap-[10px] whitespace-nowrap rounded-full border border-[rgba(242,238,226,0.16)] bg-[rgba(242,238,226,0.045)] px-5 py-[11px]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[15px] font-medium text-[#EDE7D8] sm:text-[16px]">{label}</span>
    </div>
  );
}

export function SocialProof() {
  return (
    <div id="sources" className="poy-noise relative overflow-hidden bg-[#2B3427] px-5 py-20 sm:px-10 sm:py-24 lg:py-28">
      <div className="relative">
        <div className="mx-auto max-w-[1000px] px-2 text-center sm:px-[60px]">
          <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#C9985C]">
            Who it&apos;s for
          </span>
          <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.12] tracking-[-0.5px] text-[#F2EEE2] sm:text-[40px] lg:text-[48px] lg:leading-[1.1] lg:tracking-[-1px]">
            Built for people who create and use knowledge.
          </h2>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {AUDIENCE_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className={`rounded-full px-[18px] py-[10px] text-[14px] sm:px-[22px] sm:py-[11px] sm:text-[16px] ${chip.style}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[rgba(242,238,226,0.42)] sm:text-[12px]">
            Draws from where your work already lives
          </span>
        </div>
        <div
          className="relative mt-[22px] overflow-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, #000 15%, #000 85%, transparent 100%)",
            maskImage:
              "linear-gradient(90deg, transparent 0, #000 15%, #000 85%, transparent 100%)",
          }}
        >
          <div className="poy-reel flex w-max items-center">
            <div className="flex items-center">
              {SOURCES.map((s) => (
                <SourceChip key={`a-${s.label}`} {...s} />
              ))}
            </div>
            <div className="flex items-center">
              {SOURCES.map((s) => (
                <SourceChip key={`b-${s.label}`} {...s} />
              ))}
            </div>
          </div>
        </div>

        {/* product preview */}
        <div className="mx-auto mt-16 max-w-[1000px] px-2 sm:mt-[88px] sm:px-[60px]">
          <div className="overflow-hidden rounded-2xl border border-[#E4DFCC] bg-[#F6F1F0] shadow-[0_46px_100px_-46px_rgba(38,41,34,0.45)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#E7E1D0] bg-[#F2EEE2] px-5 py-4 sm:px-[26px] sm:py-5">
              <div className="flex items-center gap-[11px]">
                <span className="font-serif text-[17px] font-semibold text-[#262922] sm:text-[20px]">
                  Your Archive
                </span>
              </div>
              <div className="flex items-center gap-[9px] text-[13px] text-[#55594D] sm:text-[15px]">
                <span className="poy-pulse h-2 w-2 rounded-full bg-[#849F7A]" />
                <span className="hidden sm:inline">
                  <strong className="font-semibold text-[#262922]">1,500 documents</strong> indexed
                  across <strong className="font-semibold text-[#262922]">10 sources</strong>
                </span>
                <span className="sm:hidden">
                  <strong className="font-semibold text-[#262922]">1,500 docs</strong> · 10 sources
                </span>
              </div>
            </div>
            <div className="relative flex h-[280px] w-full items-center justify-center bg-gradient-to-br from-[#EFE6D6] via-[#F6F1F0] to-[#E3ECDD] sm:h-[380px] lg:h-[470px]">
              <span className="text-[13px] uppercase tracking-[2px] text-[#B8AF98]">
                Product preview
              </span>
            </div>
          </div>
          <p className="mt-[18px] text-center text-[13px] text-[rgba(242,238,226,0.6)] sm:text-[14px]">
            Everything you&apos;ve made, in one place — and everything it says points back to the
            source.
          </p>
        </div>
      </div>
    </div>
  );
}
