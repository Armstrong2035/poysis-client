import Link from "next/link";

const TEMPLATES = [
  {
    id: "poysis-commerce",
    name: "Poysis Commerce",
    description: "Power your Shopify store with AI search.",
    icon: "🛍️",
    href: "https://productscout.shop",
    external: true,
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

      <div className="relative max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Link
            href="/workspace"
            className="text-sm text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-2"
          >
            ← Back
          </Link>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-900">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            Poysis
          </div>
        </div>

        <div className="mb-10">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Custom Templates</div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Start from a template</h1>
          <p className="text-zinc-500 text-sm">Pre-built pipelines for common use cases. Pick one and go.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <a
              key={t.id}
              href={t.href}
              target={t.external ? "_blank" : undefined}
              rel={t.external ? "noopener noreferrer" : undefined}
              className="group bg-white rounded-[24px] border border-zinc-200 p-8 flex flex-col hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center text-2xl mb-6 transition-all group-hover:scale-110">
                {t.icon}
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-2">{t.name}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed flex-1">{t.description}</p>
              <div className="mt-6 text-[11px] font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors flex items-center gap-1">
                View template <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </a>
          ))}

          {/* Placeholder for more templates */}
          <div className="rounded-[24px] border-2 border-dashed border-zinc-200 p-8 flex flex-col items-center justify-center text-center opacity-50">
            <div className="text-2xl mb-3">🔜</div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">More coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
