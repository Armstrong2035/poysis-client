import Link from "next/link";

const LINES = [
  { text: "You've solved this before.", opacity: 1 },
  { text: "You wrote it down.", opacity: 0.86 },
  { text: "You bookmarked it.", opacity: 0.72 },
  { text: "You saved the video.", opacity: 0.58 },
  { text: "You had the meeting.", opacity: 0.44 },
];

export function Problem() {
  return (
    <div className="bg-[#F2EEE2] px-5 py-20 sm:px-10 sm:py-24 lg:px-10 lg:py-[104px]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 lg:flex-row-reverse lg:items-stretch">
        {/* image/copy panel */}
        <div className="relative min-h-[520px] flex-1 overflow-hidden rounded-[28px] shadow-[0_50px_120px_-50px_rgba(38,41,34,0.55)] lg:min-h-[640px] lg:flex-[0_0_70%]">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(155deg, #3C4A3A 0%, #2A2E25 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,22,16,.45) 0%, rgba(20,22,16,.28) 40%, rgba(20,22,16,.55) 100%)",
            }}
          />

          <div className="relative flex h-full min-h-[520px] flex-col justify-center px-8 py-16 pb-[150px] sm:px-14 lg:min-h-[640px] lg:px-[76px]">
            <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[rgba(233,220,197,0.85)]">
              The problem
            </span>
            <div className="mt-7 flex flex-col gap-[6px]">
              {LINES.map((line) => (
                <p
                  key={line.text}
                  className="font-serif text-[26px] leading-[1.18] tracking-[-0.5px] text-[#F5F0E4] sm:text-[32px] lg:text-[36px]"
                  style={{ opacity: line.opacity, textShadow: "0 2px 24px rgba(20,22,16,.5)" }}
                >
                  {line.text}
                </p>
              ))}
            </div>
            <p
              className="mt-8 font-serif text-[32px] font-semibold italic leading-[1.08] tracking-[-1px] text-[#E8B4A8] sm:text-[40px] lg:text-[46px]"
              style={{ textShadow: "0 2px 24px rgba(20,22,16,.5)" }}
            >
              Now you can&apos;t find it.
            </p>
          </div>

          {/* ask bar payoff */}
          <div className="absolute bottom-8 left-6 right-6 flex items-center gap-3 rounded-full border border-white/50 bg-[rgba(246,241,240,0.9)] px-3 py-3 pl-5 shadow-[0_24px_50px_-20px_rgba(20,22,16,0.6)] backdrop-blur-md sm:bottom-14 sm:left-[76px] sm:right-[76px]">
            <span className="poy-pulse h-[9px] w-[9px] shrink-0 rounded-full bg-[#849F7A]" />
            <span className="flex-1 font-serif text-[15px] italic text-[#3C4A3A] sm:text-[20px]">
              &ldquo;What did I decide about pricing last spring?&rdquo;
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3C4A3A] text-[17px] text-[#F2EEE2] sm:h-11 sm:w-11 sm:text-[19px]">
              →
            </span>
          </div>
        </div>

        {/* answer copy */}
        <div className="flex flex-1 flex-col justify-center px-1 py-4 lg:px-8">
          <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#C9985C]">
            The answer
          </span>
          <h2 className="mt-6 font-serif text-[36px] font-medium leading-[1.1] tracking-[-0.8px] text-[#262922] sm:text-[46px] sm:leading-[1.08] sm:tracking-[-1.2px]">
            Stop searching.
            <br />
            <span className="italic text-[#7E3A33]">Start asking.</span>
          </h2>
          <p className="mt-6 text-[18px] leading-[1.55] text-[#55594D] sm:text-[20px]">
            Get answers grounded in your own knowledge.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-[#3C4A3A] px-8 py-[15px] text-[16px] font-semibold text-[#F2EEE2] shadow-[0_10px_24px_-10px_rgba(60,74,58,0.6)] transition-colors hover:bg-[#2E3A2A] sm:text-[17px]"
            >
              Ask your archive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
