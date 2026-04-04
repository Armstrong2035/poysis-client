import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 max-w-7xl w-full mx-auto">
        <div className="font-bold text-xl tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
          Poysis
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 mr-2">
            <Link href="/enterprise" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Enterprise
            </Link>
            <Link href="https://productscout.shop" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              eCommerce
            </Link>
          </div>
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/workspace" className="text-sm font-medium bg-black text-white px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-colors shadow-sm">
            Start Building
          </Link>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-24 px-6 md:pt-32 relative overflow-hidden">
        
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[120px] -z-10 mix-blend-multiply"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-emerald-100/40 blur-[100px] -z-10 mix-blend-multiply"></div>

        <div className="max-w-4xl text-center flex flex-col items-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 mb-8 mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            No-Code AI Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 text-zinc-900">
            Build Custom AI Apps.<br />
            <span className="text-zinc-400">Without Writing a Line of Code.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-500 max-w-3xl mb-10 leading-relaxed font-normal">
            Poysis is the intelligent canvas that lets you turn your knowledge into powerful AI co-pilots that others can use.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link href="/notebook" className="h-14 flex items-center justify-center px-8 rounded-full bg-black text-white font-medium hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 w-full sm:w-auto text-base">
              Start Building for Free
            </Link>
            <Link href="#demo" className="h-14 flex items-center justify-center px-8 rounded-full bg-white text-zinc-800 border border-zinc-200 font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-all w-full sm:w-auto text-base shadow-sm">
              See the Canvas in Action
            </Link>
          </div>
        </div>
        
        {/* Visual Mockup - The "Notebook" */}
        <div id="demo" className="mt-24 w-full max-w-5xl rounded-t-2xl border border-zinc-200/80 bg-white shadow-2xl overflow-hidden flex flex-col group z-10 border-b-0 border-x border-t">
          <div className="h-14 border-b border-zinc-100 flex items-center px-4 gap-4 bg-zinc-50/80">
            <div className="flex gap-1.5 ml-1">
              <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
              <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="h-7 w-auto px-4 bg-white border border-zinc-200 rounded-md shadow-sm flex items-center justify-center">
                <span className="text-[10px] text-zinc-400 font-medium tracking-wide">poysis.com/shared/my-copilot</span>
              </div>
            </div>
            <div className="w-12"></div>
          </div>
          
          <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 bg-[#FAFAFA]/50 bg-grid-zinc-100/[0.2]">
            <div className="flex-1 space-y-6">
              {/* Data Block */}
              <div className="bg-white border text-left border-zinc-200 rounded-xl p-5 shadow-sm transform transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">📄</div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">Knowledge Base</div>
                      <div className="text-xs text-zinc-500 font-medium">3 Documents Synchronized</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Ready</div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-md border border-zinc-100">
                    <span className="text-zinc-400">📄</span> employee_handbook_2024.pdf
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-md border border-zinc-100">
                    <span className="text-zinc-400">📄</span> q1_financial_summary.csv
                  </div>
                </div>
              </div>
              
              {/* Chat Block */}
              <div className="bg-white border text-left border-zinc-200 rounded-xl p-5 shadow-sm transform transition-all duration-500 delay-75 group-hover:-translate-y-1 group-hover:shadow-md">
                <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 pb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">💬</div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Retrieval Assistant</div>
                    <div className="text-xs text-zinc-500 font-medium">Connected to Knowledge Base</div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="flex justify-end">
                    <div className="bg-zinc-100 text-zinc-800 text-sm py-2 px-4 rounded-xl rounded-tr-sm max-w-[80%]">
                      What is our Q1 revenue growth?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white border border-zinc-200 shadow-sm text-zinc-800 text-sm py-3 px-4 rounded-xl rounded-tl-sm max-w-[90%] leading-relaxed">
                      According to the <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded cursor-pointer border border-blue-100">Q1 Summary</span>, revenue grew by 14% compared to the previous year, crossing the $2M milestone.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-72 flex flex-col gap-4">
              <div className="bg-white border text-left border-zinc-200 rounded-xl p-5 shadow-sm h-full">
                 <div className="flex items-center justify-between mb-6">
                   <div className="text-xs uppercase tracking-wider font-bold text-zinc-400">Block Settings</div>
                   <div className="w-4 h-4 text-zinc-400">⚙️</div>
                 </div>
                 
                 <div className="space-y-6">
                   <div>
                     <div className="text-xs font-semibold text-zinc-700 mb-2">Input Source</div>
                     <div className="h-9 rounded-md bg-zinc-50 border border-zinc-200 w-full flex items-center px-3 text-xs text-zinc-500">
                       <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Knowledge Base
                     </div>
                   </div>
                   
                   <div>
                     <div className="text-xs font-semibold text-zinc-700 mb-2">Response Style</div>
                     <div className="flex gap-2">
                       <div className="flex-1 h-9 rounded-md bg-black text-white text-xs font-medium flex items-center justify-center shadow-sm">Concise</div>
                       <div className="flex-1 h-9 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs font-medium flex items-center justify-center">Detailed</div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 2. Social Proof / "The Problem" Section */}
      <section className="bg-white border-y border-zinc-100 py-24 relative z-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8 text-zinc-900">
            Stop struggling with "AI Wrappers" that don't scale.
          </h2>
          <p className="text-lg md:text-xl text-zinc-500 leading-relaxed max-w-3xl mx-auto">
            Building custom AI used to mean hiring engineers to stitch together vector databases, chunking algorithms, and LLM APIs. <span className="text-zinc-800 font-medium tracking-tight">Poysis packages enterprise-grade AI architecture into simple, drag-and-drop blocks you can use visually.</span>
          </p>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-32 max-w-7xl mx-auto px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          
          {/* Feature 1 */}
          <div className="flex flex-col">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-6 shadow-sm border border-blue-100">🧱</div>
            <h3 className="text-xl font-semibold mb-4 text-zinc-900">Lego Blocks for AI Logic</h3>
            <p className="text-zinc-500 mb-6 leading-relaxed flex-1">
              Don't start from scratch. Drag and drop pre-built Compute Blocks onto your canvas to add instant capabilities.
            </p>
            <ul className="space-y-4 text-sm text-zinc-700 bg-white p-5 rounded-xl border border-zinc-200/60 shadow-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">●</span>
                <span><strong>Retrieval:</strong> Upload thousands of PDFs and chat directly with them.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">●</span>
                <span><strong>Classifier:</strong> Automatically tag and route incoming documents.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">●</span>
                <span><strong>Recommendation:</strong> Surface related intelligence proactively. All pre-wired. No prompt engineering required.</span>
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 shadow-sm border border-emerald-100">📄</div>
            <h3 className="text-xl font-semibold mb-4 text-zinc-900">A Canvas that Feels like a Notebook</h3>
            <p className="text-zinc-500 leading-relaxed">
              Unlike complex flowchart tools that look like airplane cockpits, Poysis feels as familiar as writing a document in Notion. Pick a template, upload your files, and start interacting. The complex logic (Directed Acyclic Graphs) is handled invisibly under the hood.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col">
            <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-6 shadow-sm border border-purple-100">🔒</div>
            <h3 className="text-xl font-semibold mb-4 text-zinc-900">Enterprise-Grade Data Isolation</h3>
            <p className="text-zinc-500 leading-relaxed">
              Your data never mixes. Every Poysis Notebook operates in its own completely isolated knowledge vault. Whether you are building an AI assistant for your HR team or a financial analyst for your clients, strict data boundaries guarantee zero leakage.
            </p>
          </div>

        </div>
      </section>

      {/* 4. How it Works */}
      <section className="py-32 bg-white border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 mb-4">How it Works</h2>
            <p className="text-zinc-500 text-lg">Four steps from raw data to deployed intelligence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-[#FAFAFA] border border-zinc-200 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-zinc-200 mb-6">1</div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-3">Pick a Template</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Start with a pre-configured workflow (e.g., "Knowledge Q&A" or "Data Extractor").</p>
            </div>
            
            <div className="bg-[#FAFAFA] border border-zinc-200 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-zinc-200 mb-6">2</div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-3">Feed it Knowledge</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Upload your PDFs, Excel files, or CSVs. Our engine automatically structures, chunks, and memorizes your data in seconds.</p>
            </div>

            <div className="bg-[#FAFAFA] border border-zinc-200 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-zinc-200 mb-6">3</div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-3">Wire Your Experience</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Link your AI logic to beautiful UI components—chat inputs, streaming text panels, and source citations—with visual data bindings.</p>
            </div>

            <div className="bg-[#FAFAFA] border border-zinc-200 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-zinc-200 mb-6">4</div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-3">Deploy Instantly</h4>
              <p className="text-sm text-zinc-500 leading-relaxed">Publish your AI application and share it with your team or clients instantly securely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-32 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 mb-6">The engine is ready.<br />What will you build?</h2>
        <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto">
          Stop paying developers to build AI infrastructure that already exists. Design your first intelligent Notebook today.
        </p>
        <Link href="/notebook" className="inline-flex h-14 items-center justify-center px-10 rounded-full bg-black text-white font-medium hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 text-lg">
          Try Poysis Now
        </Link>
      </section>

      <footer className="py-12 text-center text-zinc-400 text-sm border-t border-zinc-100 flex flex-col items-center gap-4 bg-white">
        <div className="flex items-center gap-2 text-zinc-900 font-semibold">
          <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
          </div>
          Poysis
        </div>
        <p>© {new Date().getFullYear()} Poysis AI. Build smarter tools.</p>
      </footer>
    </div>
  );
}
