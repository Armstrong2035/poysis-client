"use client";

import { useRef } from "react";
import Link from "next/link";

const SLIDES = [
  {
    tag: "For Pastors",
    tagStyle: "text-[#3C5A2E] bg-[rgba(132,159,122,0.28)]",
    bg: "bg-[#E4EAD9]",
    border: "border-[#D0DCC5]",
    title: "Every sermon you've preached should still be working.",
    copy: "Your congregation shouldn't have to search through years of sermons. Poysis turns your archive into a living notebook they can talk to — every answer linked back to the exact moment you preached it.",
    linkColor: "text-[#849F7A]",
  },
  {
    tag: "For Thought Leaders",
    tagStyle: "text-[#7A5A24] bg-[rgba(201,152,92,0.28)]",
    bg: "bg-[#F3E7CC]",
    border: "border-[#E6D5B0]",
    title: "Your audience shouldn't have to consume everything you've ever created.",
    copy: "Turn your essays, videos, podcasts, and frameworks into a conversational guide. Every new piece makes it smarter, and every answer points back to your original work.",
    linkColor: "text-[#C9985C]",
  },
  {
    tag: "For Law Firms",
    tagStyle: "text-[#F2EEE2] bg-[rgba(60,74,58,0.9)]",
    bg: "bg-[#DCE4D6]",
    border: "border-[#C7D3BF]",
    title: "Stop building research briefs from scratch.",
    copy: "Your firm's best thinking already exists across previous matters and research. Poysis helps associates find it in seconds — with every answer cited back to the exact document it came from.",
    linkColor: "text-[#3C4A3A]",
  },
  {
    tag: "For Consulting Firms",
    tagStyle: "text-[#F2EEE2] bg-[rgba(126,58,51,0.9)]",
    bg: "bg-[#F2E1DB]",
    border: "border-[#E4CBBF]",
    title: "Your best thinking should be reusable, not repeatable.",
    copy: "Every engagement creates valuable knowledge. Poysis turns your firm's accumulated expertise into something every consultant can reason with — so new work starts with proven thinking, not a blank page.",
    linkColor: "text-[#7E3A33]",
  },
  {
    tag: "For Solo Operators",
    tagStyle: "text-[#7A5A24] bg-[rgba(201,152,92,0.28)]",
    bg: "bg-[#F4EAD3]",
    border: "border-[#E7D8B6]",
    title: "Your knowledge should be as searchable as the internet.",
    copy: "Notes, documents, client work, research — it's all valuable if you can find it. Poysis turns your scattered work into a personal knowledge archive you can talk to, with answers you can verify.",
    linkColor: "text-[#C9985C]",
  },
  {
    tag: "For Teachers",
    tagStyle: "text-[#3C5A2E] bg-[rgba(132,159,122,0.28)]",
    bg: "bg-[#E8EBDC]",
    border: "border-[#D5DCC7]",
    title: "Your teaching should live beyond the classroom.",
    copy: "Years of lesson plans, resources, and subject expertise deserve more than folders and files. Poysis turns your teaching into a living archive students can explore, grounded in the material you've created.",
    linkColor: "text-[#849F7A]",
  },
];

export function ForEveryone() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const target = Math.max(0, Math.min(max, el.scrollLeft + dir * el.clientWidth));
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <div className="bg-[#F2EEE2] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:px-10 lg:flex-row lg:items-end lg:gap-10 lg:px-[60px]">
        <div className="max-w-[620px]">
          <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#C9985C]">
            Who it&apos;s for
          </span>
          <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.1] tracking-[-0.6px] text-[#262922] sm:text-[42px] lg:text-[52px] lg:leading-[1.08] lg:tracking-[-1.2px]">
            Poysis for <span className="italic">everyone</span>.
          </h2>
          <p className="mt-4 text-[17px] leading-[1.5] text-[#55594D] sm:text-[19px]">
            However you create knowledge, Poysis turns it into something you can talk to.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scroll(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8CEB6] bg-[#F6F1F0] text-[18px] text-[#3C4A3A] transition-colors hover:bg-[#EFE9D8] sm:h-[52px] sm:w-[52px] sm:text-[20px]"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scroll(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#3C4A3A] bg-[#3C4A3A] text-[18px] text-[#F2EEE2] transition-colors hover:bg-[#2E3A2A] sm:h-[52px] sm:w-[52px] sm:text-[20px]"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="poy-no-scrollbar mt-11 flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.tag}
            className={`poy-noise relative flex min-h-[70vh] w-full flex-none snap-center items-center justify-center overflow-hidden border-y ${slide.bg} ${slide.border} px-6 py-16 sm:px-10 sm:py-20 lg:min-h-[78vh] lg:px-[60px] lg:py-[110px]`}
          >
            <div className="relative flex w-full max-w-[760px] flex-col">
              <span
                className={`self-start rounded-full px-[14px] py-[7px] text-[11px] font-bold uppercase tracking-[1.5px] sm:text-[12px] ${slide.tagStyle}`}
              >
                {slide.tag}
              </span>
              <h3 className="mt-6 font-serif text-[30px] font-medium leading-[1.15] tracking-[-0.5px] text-[#262922] sm:text-[38px] lg:text-[46px] lg:leading-[1.1] lg:tracking-[-1px]">
                {slide.title}
              </h3>
              <p className="mt-5 text-[17px] leading-[1.6] text-[#55594D] sm:text-[19px]">
                {slide.copy}
              </p>
              <div className="mt-10 flex items-center gap-[18px] pt-6">
                <Link
                  href="/signup"
                  className="rounded-full bg-[#3C4A3A] px-6 py-3 text-[15px] font-semibold text-[#F2EEE2] transition-colors hover:bg-[#2E3A2A]"
                >
                  Get Started
                </Link>
                <span className={`text-[15px] font-semibold ${slide.linkColor}`}>Show me →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
