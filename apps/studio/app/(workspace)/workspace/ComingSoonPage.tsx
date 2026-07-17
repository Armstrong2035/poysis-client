export function ComingSoonPage({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "36px 44px", maxWidth: "700px" }}>
      <div style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "30px", fontWeight: 600, marginBottom: "4px", color: "#262922" }}>
        {title}
      </div>
      <div style={{ fontSize: "14px", color: "#55594D", marginBottom: "26px" }}>{body}</div>
      <div
        style={{
          background: "#FAF8F0",
          border: "1px dashed #C9C2AC",
          borderRadius: "14px",
          padding: "26px",
          fontSize: "13px",
          color: "#8A9488",
        }}
      >
        This section is being built next. Check back soon.
      </div>
    </div>
  );
}
