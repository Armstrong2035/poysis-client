import Link from "next/link";

export function Manifesto() {
  return (
    <div className="poy-noise relative overflow-hidden bg-[#2B3427] px-6 py-24 sm:px-10 sm:py-32 lg:py-[158px]">
      <div
        className="pointer-events-none absolute -top-[10%] left-1/2 h-[400px] w-[700px] -translate-x-1/2 sm:h-[520px] sm:w-[900px]"
        style={{
          background: "radial-gradient(closest-side, rgba(201,152,92,.18), rgba(43,52,39,0) 72%)",
        }}
      />
      <div className="relative mx-auto max-w-[960px] text-center">
        <span className="text-[13px] font-semibold uppercase tracking-[4px] text-[#C9985C]">
          Our belief
        </span>
        <h2 className="mx-auto mt-7 max-w-[900px] font-serif text-[30px] font-medium leading-[1.2] tracking-[-0.5px] text-[#F5F0E4] sm:text-[40px] sm:leading-[1.16] lg:text-[56px] lg:leading-[1.14] lg:tracking-[-1.6px]">
          We&apos;re building a future where every piece of knowledge stays alive, keeps teaching,
          and continues creating value{" "}
          <span className="italic text-[#E0A968]">
            long after it was first written down.
          </span>
        </h2>

        <div className="mt-12 sm:mt-14">
          <Link
            href="/signup"
            className="inline-block rounded-full bg-[#E0A968] px-8 py-4 text-[15px] font-bold tracking-[.2px] text-[#2B3427] shadow-[0_18px_40px_-16px_rgba(224,169,104,0.6)] transition-colors hover:bg-[#EBBB86] sm:px-10 sm:py-[18px] sm:text-[17px]"
          >
            Join the future of knowledge
          </Link>
        </div>
      </div>
    </div>
  );
}
