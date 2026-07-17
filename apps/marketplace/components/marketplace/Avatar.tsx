import { PALETTE, type CreatorColor } from "@/lib/creators";

interface AvatarProps {
  initial: string;
  color: CreatorColor;
  size: number;
  fontSize: number;
}

export function Avatar({ initial, color, size, fontSize }: AvatarProps) {
  const pal = PALETTE[color];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: pal.bg,
        color: pal.fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Source Serif 4', serif",
        fontWeight: 600,
        fontSize,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
