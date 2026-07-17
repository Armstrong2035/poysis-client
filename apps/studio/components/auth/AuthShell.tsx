import Link from "next/link";
import "./auth.css";
import { Logo } from "@/components/brand/Logo";
import { albertSans, sourceSerif4 } from "./fonts";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={`${albertSans.variable} ${sourceSerif4.variable} poy-auth-root relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F2EEE2] px-6 py-16 font-sans text-[#262922]`}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 sm:h-[520px] sm:w-[520px]">
        <div className="poy-auth-breathe absolute inset-0 rounded-full border border-[rgba(132,159,122,0.22)]" />
        <div
          className="poy-auth-breathe absolute inset-[50px] rounded-full border border-[rgba(132,159,122,0.3)] sm:inset-[60px]"
          style={{ animationDelay: ".6s" }}
        />
        <div
          className="poy-auth-breathe absolute inset-[100px] rounded-full border border-[rgba(201,152,92,0.3)] sm:inset-[120px]"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      <Link href="/" className="relative z-10 mb-10">
        <Logo />
      </Link>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <span className="text-[13px] font-semibold uppercase tracking-[3px] text-[#849F7A]">
            {eyebrow}
          </span>
          <h1 className="mt-3 font-serif text-[32px] font-medium leading-[1.1] tracking-[-0.6px] text-[#262922] sm:text-[36px]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-[#55594D]">{subtitle}</p>
        </div>

        <div className="rounded-[28px] border border-[#E4DFCC] bg-[#F6F1F0] p-7 shadow-[0_30px_70px_-40px_rgba(38,41,34,0.35)] sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-8 text-center">{footer}</div>}
      </div>

      <Link
        href="/"
        className="group relative z-10 mt-10 flex items-center gap-2 text-[13px] font-medium text-[#55594D] transition-colors hover:text-[#262922]"
      >
        <span className="transition-transform group-hover:-translate-x-1">←</span> Back to home
      </Link>
    </div>
  );
}
