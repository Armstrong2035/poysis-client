interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  className?: string;
}

const SIZES = {
  sm: { fontSize: "14px", dotBox: 10, dotR: 2.8, ringR: 4.5, dotOffset: -5 },
  md: { fontSize: "18px", dotBox: 12, dotR: 3.2, ringR: 5.2, dotOffset: -7 },
  lg: { fontSize: "26px", dotBox: 16, dotR: 4.2, ringR: 6.8, dotOffset: -9 },
};

export function Logo({
  variant = "dark",
  size = "md",
  markOnly = false,
  className,
}: LogoProps) {
  const textColor = variant === "dark" ? "#E8E9ED" : "#1A1B1E";
  const s = SIZES[size];
  const id = `logo-glow-${size}`;

  const mark = (
    <svg
      width={s.dotBox}
      height={s.dotBox}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginBottom: markOnly ? 0 : s.dotOffset }}
    >
      <defs>
        <radialGradient id={`${id}-grad`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#F5CE80" />
          <stop offset="100%" stopColor="#E8A547" />
        </radialGradient>
        <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* outer ring */}
      <circle cx="6" cy="6" r={s.ringR} stroke="#E8A547" strokeWidth="0.7" opacity="0.28" />
      {/* core dot */}
      <circle cx="6" cy="6" r={s.dotR} fill={`url(#${id}-grad)`} filter={`url(#${id})`} />
    </svg>
  );

  if (markOnly) {
    return (
      <svg
        width={s.dotBox * 2}
        height={s.dotBox * 2}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-label="Poysis"
      >
        <defs>
          <radialGradient id={`${id}-grad`} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#F5CE80" />
            <stop offset="100%" stopColor="#E8A547" />
          </radialGradient>
          <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="8.5" stroke="#E8A547" strokeWidth="0.8" opacity="0.22" />
        <circle cx="12" cy="12" r="5.5" stroke="#E8A547" strokeWidth="0.6" opacity="0.18" />
        <circle cx="12" cy="12" r="4" fill={`url(#${id}-grad)`} filter={`url(#${id})`} />
      </svg>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: size === "sm" ? "4px" : "6px",
        lineHeight: 1,
      }}
      aria-label="Poysis"
    >
      <span
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: s.fontSize,
          letterSpacing: "-0.04em",
          color: textColor,
          lineHeight: 1,
        }}
      >
        Poysis
      </span>
      {mark}
    </div>
  );
}
