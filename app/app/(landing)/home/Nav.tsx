"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Sources", href: "#sources" },
  { label: "Sign in", href: "/login" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-20 mx-auto w-full max-w-[1440px] px-6 py-6 sm:px-10 sm:py-8 lg:px-[60px]">
      <div className="flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] text-[#55594D] transition-colors hover:text-[#262922]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/signup"
            className="rounded-full bg-[#3C4A3A] px-[22px] py-[11px] text-[15px] font-semibold text-[#F2EEE2] transition-colors hover:bg-[#2E3A2A]"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8CEB6] text-[#262922] md:hidden"
        >
          <span className="relative block h-[14px] w-[16px]">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform ${open ? "translate-y-[6px] rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current transition-opacity ${open ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="mt-5 flex flex-col gap-1 rounded-2xl border border-[#E4DFCC] bg-[#F6F1F0] p-4 md:hidden">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-[15px] text-[#55594D] hover:bg-[#EFE9D8]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-[#3C4A3A] px-[22px] py-[12px] text-center text-[15px] font-semibold text-[#F2EEE2]"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
