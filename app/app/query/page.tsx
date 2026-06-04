"use client";

import { useState } from "react";
import Link from "next/link";
import { useClusteringStatus } from "../hooks/useClusteringStatus";

type Integration = {
  id: string;
  name: string;
  provider: string;
  description: string;
  status: "active" | "inactive" | "soon";
  icon: React.ReactNode;
  instructions: string[];
  fields?: { key: string; label: string; type: "text" | "password" | "select"; options?: string[] }[];
};

const INTEGRATIONS: Integration[] = [
  {
    id: "claude",
    name: "Claude",
    provider: "Anthropic",
    description: "Ask questions across your entire knowledge base using Claude's extended context window.",
    status: "active",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="rgba(232,165,71,0.12)" />
        <text x="12" y="16.5" textAnchor="middle" fill="#E8A547" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700">A</text>
      </svg>
    ),
    instructions: [
      "Go to console.anthropic.com and sign in or create an account.",
      "Navigate to API Keys and create a new key — copy it immediately.",
      "Paste your API key in the field below. It is stored locally and never sent to Poysis servers.",
      "Choose a model. Claude Sonnet is recommended for speed and quality.",
      "Poysis will use this key when you query your knowledge map.",
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password" },
      {
        key: "model", label: "Model", type: "select",
        options: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"],
      },
    ],
  },
  {
    id: "gpt4",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "Query your knowledge base with OpenAI's flagship multimodal model.",
    status: "soon",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="rgba(58,61,71,0.4)" />
        <text x="12" y="16.5" textAnchor="middle" fill="#3A3D47" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700">O</text>
      </svg>
    ),
    instructions: [
      "Sign in to platform.openai.com.",
      "Go to API Keys and generate a new secret key.",
      "Paste the key below and select your preferred model.",
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password" },
      { key: "model", label: "Model", type: "select", options: ["gpt-4o", "gpt-4o-mini"] },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google",
    description: "Use Google's Gemini models to query documents and synthesize answers.",
    status: "soon",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="rgba(58,61,71,0.4)" />
        <text x="12" y="16.5" textAnchor="middle" fill="#3A3D47" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700">G</text>
      </svg>
    ),
    instructions: [
      "Visit aistudio.google.com and sign in.",
      "Create an API key under Get API Key.",
      "Paste the key below.",
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password" },
      { key: "model", label: "Model", type: "select", options: ["gemini-1.5-pro", "gemini-1.5-flash"] },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    provider: "Mistral AI",
    description: "Lightweight open-weight models for fast knowledge retrieval.",
    status: "soon",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="rgba(58,61,71,0.4)" />
        <text x="12" y="16.5" textAnchor="middle" fill="#3A3D47" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700">M</text>
      </svg>
    ),
    instructions: [
      "Go to console.mistral.ai and create an account.",
      "Create an API key in the API Keys section.",
      "Paste the key below and choose a model.",
    ],
    fields: [
      { key: "api_key", label: "API Key", type: "password" },
      { key: "model", label: "Model", type: "select", options: ["mistral-large", "mistral-small"] },
    ],
  },
];

export default function QueryPage() {
  const active = INTEGRATIONS.filter((i) => i.status === "active");
  const soon = INTEGRATIONS.filter((i) => i.status === "soon");
  const clustering = useClusteringStatus();

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0A0B0F", color: "#E8E9ED" }}
    >
      {/* Atmospheric top glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(232,165,71,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px),
                            repeating-linear-gradient(90deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px)`,
          opacity: 0.025,
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6 py-12">
        {/* Back nav */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 mb-10 transition-colors group"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "10px",
            letterSpacing: "0.18em",
            color: "#9CA0AC",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"
            className="group-hover:stroke-[#E8A547] transition-colors">
            <line x1="12" y1="7" x2="2" y2="7" />
            <polyline points="6,3 2,7 6,11" />
          </svg>
          <span className="group-hover:text-[#E8A547] transition-colors">Dashboard</span>
        </Link>

        {/* Page header */}
        <div className="mb-10">
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#E8E9ED",
              marginBottom: "8px",
            }}
          >
            Query Integrations
          </h1>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              fontWeight: 300,
              color: "#9CA0AC",
              lineHeight: 1.6,
            }}
          >
            Connect an AI model to query your knowledge map. Poysis uses your key
            directly — nothing is proxied through our servers.
          </p>
        </div>

        {/* Active integrations */}
        <section className="mb-10">
          <SectionLabel text={`Active · ${active.length}`} />
          <div className="space-y-4">
            {active.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                clustering={integration.id === "claude" ? clustering : undefined}
              />
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <section>
          <SectionLabel text="Coming Soon" />
          <div className="space-y-3">
            {soon.map((integration) => (
              <SoonCard key={integration.id} integration={integration} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="mb-4"
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "9px",
        letterSpacing: "0.2em",
        color: "#9CA0AC",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

function IntegrationCard({
  integration,
  clustering,
}: {
  integration: Integration;
  clustering?: ReturnType<typeof useClusteringStatus>;
}) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    // TODO: persist to localStorage / user settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        background: "rgba(232,165,71,0.04)",
        border: "1px solid rgba(232,165,71,0.2)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-6 py-5">
        <div className="flex-shrink-0">{integration.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "#E8E9ED",
                letterSpacing: "-0.01em",
              }}
            >
              {integration.name}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                color: "#9CA0AC",
                letterSpacing: "0.1em",
              }}
            >
              by {integration.provider}
            </span>
          </div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              fontWeight: 300,
              color: "#9CA0AC",
              marginTop: "3px",
              lineHeight: 1.5,
            }}
          >
            {integration.description}
          </p>
        </div>
        <ActiveBadge />
      </div>

      <div style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
        {/* Instructions toggle */}
        <button
          onClick={() => setInstructionsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-3 transition-colors hover:bg-[rgba(232,165,71,0.04)]"
        >
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: "#E8A547",
              textTransform: "uppercase",
            }}
          >
            Setup Instructions
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#E8A547"
            strokeWidth="1.4"
            style={{
              transform: instructionsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
        </button>

        {instructionsOpen && (
          <div
            className="px-6 pb-5"
            style={{ borderTop: "1px solid rgba(58,61,71,0.3)" }}
          >
            <ol className="space-y-3 mt-4">
              {integration.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                    style={{
                      background: "rgba(232,165,71,0.1)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "#E8A547",
                      marginTop: "1px",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "13px",
                      fontWeight: 300,
                      color: "#9CA0AC",
                      lineHeight: 1.6,
                    }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Config fields */}
      {integration.fields && (
        <div
          className="px-6 py-5 space-y-4"
          style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}
        >
          {integration.fields.map((field) => (
            <div key={field.key}>
              <label
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.18em",
                  color: "#9CA0AC",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  value={values[field.key] ?? field.options?.[0] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  style={{
                    width: "100%",
                    background: "rgba(10,11,15,0.8)",
                    border: "1px solid rgba(58,61,71,0.6)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "12px",
                    color: "#E8E9ED",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(232,165,71,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(58,61,71,0.6)")}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt} style={{ background: "#0A0B0F" }}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  placeholder={field.type === "password" ? "sk-ant-••••••••••••••••" : ""}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  style={{
                    width: "100%",
                    background: "rgba(10,11,15,0.8)",
                    border: "1px solid rgba(58,61,71,0.6)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "12px",
                    color: "#E8E9ED",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(232,165,71,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(58,61,71,0.6)")}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded transition-all duration-200"
              style={
                saved
                  ? {
                      background: "rgba(107,176,122,0.15)",
                      border: "1px solid rgba(107,176,122,0.4)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      color: "#6BB07A",
                      textTransform: "uppercase",
                    }
                  : {
                      background: "linear-gradient(135deg, #E8A547 0%, #C99547 100%)",
                      border: "1px solid transparent",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      color: "#0A0B0F",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }
              }
            >
              {saved ? "✓ Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* MCP URL section — shown for Claude once clustering is done */}
      {clustering && (
        <div style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
          {clustering.status === "done" && clustering.mcpUrl ? (
            <div className="px-6 py-5 space-y-4">
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  color: "#9CA0AC",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Claude.ai MCP URL
              </div>

              {/* URL copy row */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded"
                style={{
                  background: "rgba(10,11,15,0.8)",
                  border: "1px solid rgba(232,165,71,0.25)",
                }}
              >
                <code
                  className="flex-1 truncate"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "11px",
                    color: "#E8A547",
                    letterSpacing: "0.02em",
                  }}
                >
                  {clustering.mcpUrl}
                </code>
                <button
                  onClick={() => handleCopy(clustering.mcpUrl!)}
                  className="flex-shrink-0 px-2.5 py-1 rounded transition-all"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    border: copied
                      ? "1px solid rgba(107,176,122,0.4)"
                      : "1px solid rgba(232,165,71,0.3)",
                    color: copied ? "#6BB07A" : "#E8A547",
                    background: copied
                      ? "rgba(107,176,122,0.08)"
                      : "rgba(232,165,71,0.06)",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>

              {/* Setup steps */}
              <div
                className="rounded px-4 py-3 space-y-2"
                style={{ background: "rgba(232,165,71,0.04)", border: "1px solid rgba(232,165,71,0.1)" }}
              >
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "9px",
                    letterSpacing: "0.18em",
                    color: "#9CA0AC",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Add to Claude.ai
                </div>
                {[
                  "Go to claude.ai and open Settings",
                  "Navigate to Integrations → Cloud Connectors",
                  'Click "Add Custom MCP Server"',
                  "Paste the URL above and save",
                  "Ask Claude about your knowledge base",
                ].map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center"
                      style={{
                        background: "rgba(232,165,71,0.1)",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "8px",
                        color: "#E8A547",
                        marginTop: "2px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "#9CA0AC",
                        lineHeight: 1.5,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : clustering.status === "running" ? (
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ background: "rgba(232,165,71,0.03)" }}
            >
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="#E8A547" strokeWidth="1.5"
                style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
              >
                <circle cx="7" cy="7" r="5.5" strokeDasharray="20 14" strokeLinecap="round" />
              </svg>
              <span
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#9CA0AC",
                }}
              >
                Building knowledge map
                {(clustering.totalTopics ?? 0) > 0 && (
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "9px",
                      color: "#9CA0AC",
                      marginLeft: "8px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    · {clustering.totalTopics} topics
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="px-6 py-4">
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#3A3D47",
                }}
              >
                Connect a source and build your knowledge map to get your MCP URL.{" "}
                <Link
                  href="/dashboard"
                  style={{ color: "#E8A547", textDecoration: "none" }}
                  className="hover:text-[#F5B25F] transition-colors"
                >
                  Go to Sources →
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SoonCard({ integration }: { integration: Integration }) {
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  return (
    <div
      style={{
        background: "rgba(58,61,71,0.08)",
        border: "1px solid rgba(58,61,71,0.3)",
        borderRadius: "12px",
        overflow: "hidden",
        opacity: 0.6,
      }}
    >
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex-shrink-0">{integration.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "#9CA0AC",
                letterSpacing: "-0.01em",
              }}
            >
              {integration.name}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                color: "#3A3D47",
                letterSpacing: "0.1em",
              }}
            >
              by {integration.provider}
            </span>
          </div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              fontWeight: 300,
              color: "#3A3D47",
              marginTop: "2px",
            }}
          >
            {integration.description}
          </p>
        </div>
        <SoonPill />
      </div>

      {/* Instructions preview (collapsible even for soon) */}
      <div style={{ borderTop: "1px solid rgba(58,61,71,0.3)" }}>
        <button
          onClick={() => setInstructionsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-3"
        >
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: "#3A3D47",
              textTransform: "uppercase",
            }}
          >
            Setup Preview
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#3A3D47"
            strokeWidth="1.4"
            style={{
              transform: instructionsOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
        </button>

        {instructionsOpen && (
          <div
            className="px-6 pb-4"
            style={{ borderTop: "1px solid rgba(58,61,71,0.2)" }}
          >
            <ol className="space-y-2 mt-4">
              {integration.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                    style={{
                      background: "rgba(58,61,71,0.4)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "9px",
                      color: "#3A3D47",
                      marginTop: "1px",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "13px",
                      fontWeight: 300,
                      color: "#3A3D47",
                      lineHeight: 1.5,
                    }}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveBadge() {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-[#6BB07A]"
        style={{ boxShadow: "0 0 5px rgba(107,176,122,0.7)" }}
      />
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: "#6BB07A",
          textTransform: "uppercase",
        }}
      >
        Active
      </span>
    </div>
  );
}

function SoonPill() {
  return (
    <div
      className="px-2 py-0.5 rounded flex-shrink-0"
      style={{
        background: "rgba(58,61,71,0.4)",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "8px",
        letterSpacing: "0.15em",
        color: "#3A3D47",
        textTransform: "uppercase",
      }}
    >
      Soon
    </div>
  );
}
