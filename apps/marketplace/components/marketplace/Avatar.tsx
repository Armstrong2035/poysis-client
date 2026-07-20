import { PALETTE, type CreatorColor } from "@/lib/creators";

interface AvatarProps {
  initial: string;
  color: CreatorColor;
  size: number;
  fontSize: number;
}

// A monogram "plate" — a soft-squared, subtly embossed stamp rather than a flat
// disc, with a gilt corner tick that reads as the "catalogued" mark. The inset
// shadow gives the flat palette colour dimension without needing a gradient.
export function Avatar({ initial, color, size, fontSize }: AvatarProps) {
  const pal = PALETTE[color];
  return (
    <div
      className="mkt-plate"
      style={{
        width: size,
        height: size,
        background: pal.bg,
        color: pal.fg,
        fontSize,
      }}
    >
      {initial}
    </div>
  );
}
