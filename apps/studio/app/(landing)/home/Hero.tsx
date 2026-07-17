"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

const ROLES = [
  {
    role: "Knowledge Companion.",
    desc: "Helping you think, explore ideas, and make better decisions — with every answer pointing back to the original source.",
  },
  {
    role: "Research Assistant.",
    desc: "Find answers across years of documents, meetings, and videos in seconds, always backed by the original source.",
  },
  {
    role: "Brainstorming Buddy.",
    desc: "Develop better ideas by building on everything you've already learned instead of starting from a blank page.",
  },
  {
    role: "Thought Partner.",
    desc: "Connect ideas, challenge assumptions, and uncover patterns hidden across your work.",
  },
  {
    role: "Decision Partner.",
    desc: "Make faster, more confident decisions by drawing on your past work instead of relying on memory.",
  },
  {
    role: "Living Notebook.",
    desc: "Turn years of work into something you — and everyone you choose — can explore through conversation.",
  },
];

const SOURCE_CHIPS = [
  { label: "Sunday sermon · 2019", color: "#849F7A", top: "20%", left: "14%", delay: "0s", dur: "6.5s" },
  { label: "Field notes.pdf", color: "#C9985C", top: "60%", left: "8%", delay: ".8s", dur: "7.5s" },
  { label: "Keynote transcript", color: "#7E3A33", top: "30%", right: "9%", delay: "1.1s", dur: "6.8s" },
];

export function Hero() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setVisible(false);
      timeout = setTimeout(() => {
        setIdx((i) => (i + 1) % ROLES.length);
        setVisible(true);
      }, 480);
    }, 3600);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const current = ROLES[idx];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-14 px-6 pb-16 pt-4 sm:px-10 lg:flex-row lg:items-center lg:gap-14 lg:px-[60px] lg:pb-[72px] lg:pt-5">
      {/* left copy */}
      <div className="w-full max-w-[580px] lg:flex-1">
        <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#849F7A]">
          Your living archive
        </span>
        <h1 className="mt-5 font-serif text-[44px] font-medium leading-[1.05] tracking-[-1px] text-[#262922] sm:text-[58px] sm:leading-[1.03] sm:tracking-[-1.3px] lg:text-[78px] lg:leading-[1.02] lg:tracking-[-1.6px]">
          Your best thinking, <span className="italic">on demand.</span>
        </h1>
        <div className="mt-7 max-w-[530px]">
          <p className="text-[17px] leading-[1.6] text-[#55594D] sm:text-[19px]">
            You&apos;ve already created the knowledge. It&apos;s buried in documents, videos, notes,
            bookmarks, and years of work.
          </p>
          <div className="mt-[18px] min-h-[150px]">
            <div
              className="transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
              }}
            >
              <p className="text-[19px] leading-[1.45] text-[#262922] sm:text-[22px]">
                Poysis becomes your{" "}
                <span className="font-serif font-semibold italic text-[#3C4A3A]">{current.role}</span>
              </p>
              <p className="mt-[10px] text-[16px] leading-[1.6] text-[#55594D] sm:text-[17px]">
                {current.desc}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <Link
            href="/signup"
            className="rounded-full bg-[#3C4A3A] px-[30px] py-[15px] text-[16px] font-semibold text-[#F2EEE2] shadow-[0_10px_24px_-10px_rgba(60,74,58,0.6)] transition-colors hover:bg-[#2E3A2A] sm:px-[34px] sm:py-4 sm:text-[17px]"
          >
            Get Started
          </Link>
          <a
            href="#how-it-works"
            className="text-[15px] text-[#55594D] transition-colors hover:text-[#262922] sm:text-[16px]"
          >
            See how it works →
          </a>
        </div>
      </div>

      {/* right visual */}
      <div className="relative w-full flex-1 self-stretch lg:min-h-[620px]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[26px] border border-[#E4DFCC] bg-[#F6F1F0] sm:min-h-[520px] lg:absolute lg:inset-0 lg:min-h-0">
          {/* concentric rings */}
          <div className="absolute left-1/2 top-[42%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 sm:h-[380px] sm:w-[380px] lg:h-[460px] lg:w-[460px]">
            <div className="poy-breathe absolute inset-0 rounded-full border-[1.5px] border-[rgba(132,159,122,0.35)]" />
            <div
              className="poy-breathe absolute inset-[46px] rounded-full border-[1.5px] border-[rgba(132,159,122,0.5)] sm:inset-[58px] lg:inset-[70px]"
              style={{ animationDelay: ".6s" }}
            />
            <div
              className="poy-breathe absolute inset-[92px] rounded-full border-[1.5px] border-[rgba(201,152,92,0.5)] sm:inset-[116px] lg:inset-[140px]"
              style={{ animationDelay: "1.2s" }}
            />
          </div>
          {/* glow */}
          <div
            className="absolute left-1/2 top-[42%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 blur-[4px] sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px]"
            style={{
              background:
                "radial-gradient(closest-side, rgba(132,159,122,.30), rgba(242,238,226,0) 72%)",
            }}
          />
          {/* center orb */}
          <div className="poy-float absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
            <div className="drop-shadow-[0_12px_22px_rgba(60,74,58,0.28)]">
              <LogoMark size={96} />
            </div>
          </div>
          {/* source chips */}
          {SOURCE_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="poy-float absolute hidden items-center gap-[7px] rounded-full border border-[#E4DFCC] bg-[#F2EEE2] px-[13px] py-2 text-[13px] text-[#55594D] shadow-[0_8px_18px_-10px_rgba(38,41,34,0.3)] sm:flex"
              style={{
                top: chip.top,
                left: chip.left,
                right: chip.right,
                animationDelay: chip.delay,
                animationDuration: chip.dur,
              }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: chip.color }} />
              <span>{chip.label}</span>
            </div>
          ))}
          {/* ask bar */}
          <div className="absolute bottom-[22px] left-4 right-4 flex items-center gap-3 rounded-full border border-[#E4DFCC] bg-white px-3 py-3 pl-5 shadow-[0_14px_30px_-16px_rgba(38,41,34,0.35)] sm:bottom-[30px] sm:left-8 sm:right-8">
            <span className="flex-1 text-[14px] text-[#9a9789] sm:text-[15px]">
              Ask your archive anything…
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3C4A3A] text-[16px] text-[#F2EEE2] sm:h-[38px] sm:w-[38px] sm:text-[17px]">
              →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
