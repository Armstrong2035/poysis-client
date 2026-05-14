/**
 * Constellation map — visual metaphor for "navigable territory".
 * Static SVG, animated via CSS (slow rotation).
 */
export function StationCluster() {
  return (
    <svg
      className="lv2-station-cluster"
      viewBox="-200 -200 400 400"
      aria-hidden="true"
    >
      <circle
        cx="0"
        cy="0"
        r="180"
        fill="none"
        stroke="rgba(232,165,71,0.18)"
        strokeWidth="0.6"
      />
      <circle
        cx="0"
        cy="0"
        r="120"
        fill="none"
        stroke="rgba(232,165,71,0.14)"
        strokeWidth="0.6"
      />
      <circle
        cx="0"
        cy="0"
        r="60"
        fill="none"
        stroke="rgba(232,165,71,0.12)"
        strokeWidth="0.6"
      />

      {/* Connecting lines from center to outer nodes */}
      <g stroke="rgba(232,165,71,0.18)" strokeWidth="0.5" fill="none">
        <line x1="0" y1="0" x2="120" y2="-40" />
        <line x1="0" y1="0" x2="-90" y2="-130" />
        <line x1="0" y1="0" x2="60" y2="120" />
        <line x1="0" y1="0" x2="-150" y2="80" />
      </g>

      {/* Nodes */}
      <g fill="rgba(232,165,71,0.4)">
        <circle cx="0" cy="0" r="4" />
        <circle cx="120" cy="-40" r="2.5" />
        <circle cx="-90" cy="-130" r="2" />
        <circle cx="60" cy="120" r="2.5" />
        <circle cx="-150" cy="80" r="2" />
        <circle cx="170" cy="60" r="1.6" />
        <circle cx="-40" cy="160" r="1.6" />
      </g>
    </svg>
  );
}
