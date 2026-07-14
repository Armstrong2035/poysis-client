import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="bg-[#2A2E25] px-6 py-12 sm:px-10 lg:px-[60px]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 sm:flex-row">
        <Logo variant="reversed" size={22} />
        <div className="flex flex-wrap items-center justify-center gap-6 text-[14px] text-[rgba(242,238,226,0.7)]">
          <a href="#how-it-works" className="hover:text-[#F2EEE2]">
            How it works
          </a>
          <a href="#sources" className="hover:text-[#F2EEE2]">
            Sources
          </a>
          <Link href="/login" className="hover:text-[#F2EEE2]">
            Sign in
          </Link>
        </div>
        <p className="text-[13px] text-[rgba(242,238,226,0.45)]">
          © {new Date().getFullYear()} Poysis. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
