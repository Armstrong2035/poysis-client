"use client";

import { useNotebookStore } from "../../store/notebookStore";

export function ThemeCustomizer() {
  const { theme, setTheme } = useNotebookStore();

  const handleColorChange = (key: 'primaryColor' | 'backgroundColor', value: string) => {
    setTheme({ [key]: value });
  };

  const handleSelectChange = (key: string, value: string) => {
    setTheme({ [key]: value });
  };

  const fonts = [
    { id: 'font-sans', label: 'Inter (Sans)' },
    { id: 'font-serif', label: 'Playfair Display (Serif)' },
    { id: 'font-mono', label: 'JetBrains Mono (Mono)' },
  ];

  const radii = [
    { id: '0px', label: 'Sharp' },
    { id: '12px', label: 'Rounded' },
    { id: '24px', label: 'Pill' },
  ];

  const borders = [
    { id: '0px', label: 'None' },
    { id: '1px', label: 'Regular' },
    { id: '2px', label: 'Thick' },
  ];

  const shadows = [
    { id: 'none', label: 'None' },
    { id: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)', label: 'Subtle' },
    { id: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', label: 'Medium' },
    { id: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', label: 'Deep' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Branding Section */}
      <section>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Branding</div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">App Label</label>
            <input
              type="text"
              value={theme.appLabel}
              onChange={(e) => setTheme({ appLabel: e.target.value })}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              placeholder="e.g. My AI Assistant"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700">Environment Banner</span>
            <button
              onClick={() => setTheme({ showBanner: !theme.showBanner })}
              className={`relative w-9 h-5 rounded-full transition-colors ${theme.showBanner ? "bg-emerald-500" : "bg-zinc-200"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme.showBanner ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Colors</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Primary</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border-none p-0"
              />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{theme.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">App BG</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                className="w-8 h-8 rounded-lg overflow-hidden cursor-pointer border-none p-0"
              />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{theme.backgroundColor}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Layout Section */}
      <section>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Layout & Style</div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Corner Radius</label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-lg">
              {radii.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectChange('borderRadius', r.id)}
                  className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${theme.borderRadius === r.id ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Border Width</label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-lg">
              {borders.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectChange('borderWidth', b.id)}
                  className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all ${theme.borderWidth === b.id ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Elevation (Shadow)</label>
            <div className="grid grid-cols-2 gap-2">
              {shadows.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectChange('boxShadow', s.id)}
                  className={`px-3 py-2 rounded-lg border text-[10px] font-bold transition-all text-left ${theme.boxShadow === s.id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Typography</div>
        <div className="space-y-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectChange('fontFamily', f.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${theme.fontFamily === f.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-white hover:border-zinc-200 text-zinc-700"}`}
            >
              <span className={`text-sm ${f.id}`}>{f.label}</span>
              {theme.fontFamily === f.id && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
