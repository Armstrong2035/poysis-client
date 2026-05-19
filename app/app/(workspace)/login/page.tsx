"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "../../lib/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="w-8 h-8 border-4 border-black/10 border-t-black animate-spin rounded-full"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Canvas Dot Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 z-0"></div>
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black rounded-2xl shadow-xl shadow-black/10 mb-6 group hover:scale-105 transition-transform duration-300">
            <div className="w-4 h-4 bg-white rounded-md"></div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
            Welcome to Poysis
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            The headless dataflow engine for the modern web.
          </p>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-[32px] p-8 shadow-2xl shadow-zinc-200/50 backdrop-blur-xl transition-all duration-500 hover:shadow-zinc-300/50 group/card">
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl mb-8">
            <button 
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === "login" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === "signup" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-3 animate-in shake-in-from-top-1 duration-300">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-bold text-emerald-700 flex items-start gap-3 animate-in fade-in duration-500">
              <span className="text-lg leading-none mt-[-2px]">📧</span>
              <span>{message}</span>
            </div>
          )}

          <form action={mode === "login" ? login : signup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                name="email"
                type="email" 
                required
                placeholder="you@domain.com"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-zinc-300 transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1 leading-none">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                {mode === "login" && (
                   <Link href="/forgot" className="text-[10px] font-bold text-zinc-400 hover:text-black transition-colors uppercase tracking-widest">Forgot?</Link>
                )}
              </div>
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-zinc-300 transition-all text-sm font-medium"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl text-sm font-bold shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Get Started"}
                    <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-zinc-400 font-medium leading-relaxed">
            By continuing, you agree to Poysis's <br/>
            <Link href="/terms" className="text-zinc-600 hover:text-black transition-colors font-bold border-b border-zinc-200">Terms of Service</Link> and <Link href="/privacy" className="text-zinc-600 hover:text-black transition-colors font-bold border-b border-zinc-200">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-12 text-center">
           <Link href="/" className="text-xs font-bold text-zinc-400 hover:text-black transition-colors flex items-center justify-center gap-2 group">
             <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to home
           </Link>
        </div>
      </div>
    </div>
  );
}
