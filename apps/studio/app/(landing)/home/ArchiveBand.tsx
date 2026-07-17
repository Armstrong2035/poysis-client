export function ArchiveBand() {
  return (
    <div className="relative h-[420px] w-full overflow-hidden bg-[#2A2E25] sm:h-[520px] lg:h-[660px]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 30% 20%, rgba(60,74,58,.55) 0%, rgba(42,46,37,1) 60%), radial-gradient(90% 70% at 80% 90%, rgba(126,58,51,.4) 0%, rgba(42,46,37,0) 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, rgba(60,74,58,.62) 0%, rgba(126,58,51,.5) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,28,22,.28) 0%, rgba(26,28,22,.12) 42%, rgba(26,28,22,.66) 100%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center sm:px-10">
        <span className="text-[12px] font-semibold uppercase tracking-[3.5px] text-[rgba(233,220,197,0.85)] sm:text-[13px]">
          Your living archive
        </span>
        <h2
          className="mt-5 max-w-[900px] font-serif text-[32px] font-medium leading-[1.15] tracking-[-0.5px] text-[#F5F0E4] sm:text-[44px] sm:leading-[1.1] lg:text-[60px] lg:leading-[1.08] lg:tracking-[-1.4px]"
          style={{ textShadow: "0 2px 24px rgba(20,22,16,.4)" }}
        >
          The library of <span className="italic">everything you know</span>.
        </h2>
        <p className="mt-6 max-w-[560px] text-[17px] leading-[1.5] text-[rgba(240,235,224,0.9)] sm:text-[20px]">
          Gathered in one place. Cited to the source. Never lost again.
        </p>
      </div>
    </div>
  );
}
