"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type OnboardingStep = "connect" | "processing" | "ready";

const PROCESSING_STEPS = [
  "Reading your documents…",
  "Identifying topics…",
  "Clustering related knowledge…",
  "Building your map…",
];

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("connect");
  const [processedSteps, setProcessedSteps] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (step === "processing" && !isProcessing) {
      setIsProcessing(true);
      let current = 0;

      const interval = setInterval(() => {
        if (current < PROCESSING_STEPS.length - 1) {
          setProcessedSteps(current + 1);
          current++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStep("ready"), 800);
        }
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [step, isProcessing]);

  const handleConnect = () => {
    // Simulate connecting to Google Drive
    setStep("processing");
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#E8E9ED] font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Vignette gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0B0F_100%)] pointer-events-none z-0" />

      {/* Subtle grid backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0" style={{
        backgroundImage: `repeating-linear-gradient(0deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px),
                          repeating-linear-gradient(90deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px)`,
      }} />

      <div className="w-full max-w-2xl relative z-10">
        {/* Step indicator */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs font-mono text-[#E8A547]/60 mb-16 px-6">
          <span>STEP {step === "connect" ? "1" : step === "processing" ? "2" : "3"} / 3</span>
        </div>

        <div className="pt-24 pb-16">
          {/* Connect Step */}
          {step === "connect" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-16 text-center">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
                  Connect your knowledge
                </h1>
                <p className="text-lg text-[#E8E9ED]/70">
                  Link your data sources to start mapping your work
                </p>
              </div>

              <div className="space-y-4 mb-12">
                {/* Google Drive Button */}
                <button
                  onClick={handleConnect}
                  className="w-full px-8 py-5 bg-[#E8A547] hover:bg-[#F5B25F] text-[#0A0B0F] rounded-2xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-[#E8A547]/40 active:translate-y-0"
                >
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10z" />
                    </svg>
                    Connect Google Drive
                  </span>
                </button>

                {/* Coming Soon Sources */}
                <div className="mt-8 pt-8 border-t border-[#E8A547]/20">
                  <p className="text-sm text-[#E8E9ED]/50 mb-4 font-mono">COMING SOON</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Notion", "Gmail", "Microsoft 365", "Slack", "Confluence", "Dropbox"].map((source) => (
                      <div
                        key={source}
                        className="px-4 py-3 border border-[#E8A547]/20 rounded-xl text-center text-sm text-[#E8E9ED]/40 hover:border-[#E8A547]/40 transition-colors"
                      >
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tour Prompt */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl border border-[#E8A547]/40 bg-[#0A0B0F]/80 backdrop-blur-lg flex items-center gap-4 text-sm animate-in fade-in slide-in-from-bottom-2 duration-700" style={{ animation: "fadeUp 0.35s ease-out" }}>
                <span className="font-mono text-[#E8A547]/60">1 / 3</span>
                <span className="text-[#E8E9ED]/70">Connect your first source to begin</span>
                <button className="text-xs font-mono text-[#E8A547]/60 hover:text-[#E8A547] transition-colors ml-auto">
                  Skip →
                </button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-16 text-center">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
                  Arranging your knowledge
                </h1>
                <p className="text-lg text-[#E8E9ED]/70">
                  Processing 247 documents
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                {PROCESSING_STEPS.map((statusText, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 text-lg transition-all duration-500 ${
                      idx < processedSteps ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                      idx < processedSteps ? "bg-[#E8A547] animate-pulse" : "bg-[#E8A547]/20"
                    }`} />
                    <span className={idx < processedSteps ? "text-[#E8E9ED]" : "text-[#E8E9ED]/40"}>
                      {statusText}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ready Step */}
          {step === "ready" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
              <div className="mb-12">
                <div className="mb-8 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#E8A547]/20 border-2 border-[#E8A547] flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#E8A547] animate-pulse" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3" style={{ fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
                  Your knowledge is ready
                </h1>
                <p className="text-lg text-[#E8E9ED]/70">
                  All 247 documents have been mapped and indexed
                </p>
              </div>

              <Link
                href="/workspace"
                className="inline-block px-8 py-5 bg-[#E8A547] hover:bg-[#F5B25F] text-[#0A0B0F] rounded-2xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-[#E8A547]/40 active:translate-y-0"
              >
                <span className="flex items-center gap-2">
                  Open your map
                  <span>→</span>
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
