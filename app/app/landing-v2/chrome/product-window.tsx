type Props = {
  label: string;
  status?: string;
  children: React.ReactNode;
};

/**
 * Shared product-mockup window used by Scenes 4-6.
 * Provides the bracketed frame, label/status header, and vignette overlay.
 * Each scene supplies its own inner content via `children`.
 */
export function ProductWindow({ label, status = "Demo", children }: Props) {
  return (
    <div className="lv2-window">
      <span className="lv2-window__label">{label}</span>
      <span className="lv2-window__status">{status}</span>

      <span className="lv2-window__bracket lv2-window__bracket--tl" />
      <span className="lv2-window__bracket lv2-window__bracket--tr" />
      <span className="lv2-window__bracket lv2-window__bracket--bl" />
      <span className="lv2-window__bracket lv2-window__bracket--br" />

      <div className="lv2-window__inner">{children}</div>

      <div className="lv2-window__vignette" />
    </div>
  );
}
