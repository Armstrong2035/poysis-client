import Link from "next/link";
import { createClient } from "../../utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createNotebook, deleteNotebook } from "../../lib/actions";
import { logout } from "../../lib/auth";
import { DeleteNotebookButton } from "../../components/workspace/DeleteNotebookButton";

export default async function WorkspacePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check for active session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect("/login");
  }

  // Fetch all notebooks for this user
  const { data: notebooks } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  // Fetch document count for vector storage indicator
  const { count: docCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200">
      
      {/* --- Main Workspace Canvas --- */}
      <div className="flex-1 px-8 py-16 md:px-16 flex flex-col overflow-y-auto relative">
        {/* Premium Canvas Dot Grid Backdrop */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 z-0"></div>
        
        <header className="mb-12 relative z-10">
          <h1 className="text-4xl font-medium tracking-tight text-zinc-900 mb-2">
            Welcome to your Workspace
          </h1>
          <p className="text-lg text-zinc-500">
            Design, deploy, and manage your intelligence layer.
          </p>
        </header>

        <div className="relative z-10">
          {(!notebooks || notebooks.length === 0) ? (
            /* Empty State: Get Started */
            <div className="flex flex-col flex-1 animate-in fade-in duration-700">
              <h2 className="text-xl font-medium mb-6 text-zinc-800">Get Started</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Option 1: Blank Canvas (Triggering createNotebook action) */}
                <form action={createNotebook}>
                  <button 
                    type="submit"
                    className="w-full group relative rounded-[32px] border-2 border-dashed border-zinc-200 bg-white/50 p-8 flex flex-col items-center justify-center text-center hover:border-zinc-400 hover:bg-white transition-all shadow-sm hover:shadow-xl h-[280px]"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform text-zinc-400 group-hover:text-black group-hover:bg-zinc-50 group-hover:shadow-lg group-hover:shadow-black/5">
                      +
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 mb-2">Blank Canvas</h3>
                    <p className="text-sm text-zinc-500">Start from scratch. Drop in compute blocks and wire them up manually.</p>
                  </button>
                </form>

                {/* Option 2: Knowledge Q&A Template */}
                <div className="relative rounded-[32px] border border-zinc-200 bg-white p-6 flex flex-col shadow-sm transition-all h-[280px] opacity-70 cursor-default">
                  <div className="absolute top-4 right-4">
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-5 border border-blue-100 shadow-sm">
                    📄
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-2">Knowledge Q&A</h3>
                  <p className="text-sm text-zinc-500 flex-1 leading-relaxed">
                    A pre-wired retrieval pipeline. Drop in your PDFs and instantly chat with them.
                  </p>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4">
                    Template · Chat + RAG
                  </div>
                </div>

                {/* Option 3: Product Scout Template */}
                <div className="relative rounded-[32px] border border-zinc-200 bg-white p-6 flex flex-col shadow-sm transition-all h-[280px] opacity-70 cursor-default">
                  <div className="absolute top-4 right-4">
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-5 border border-purple-100 shadow-sm">
                    🛍️
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 mb-2">Poysis Commerce</h3>
                  <p className="text-sm text-zinc-500 flex-1 leading-relaxed">
                    User-facing AI co-pilots for Shopify merchants. Built on the semantic search core.
                  </p>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4">
                    Template · Search + Commerce
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Populated State: Active Notebooks */
            <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Your Notebooks</h2>
                <form action={createNotebook}>
                  <button type="submit" className="bg-black text-white px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-black/10">
                    New Notebook
                  </button>
                </form>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notebooks.map((nb) => {
                  const deleteWithId = deleteNotebook.bind(null, nb.id);
                  return (
                    <div key={nb.id} className="group relative rounded-[32px] border border-zinc-200 bg-white p-6 flex flex-col shadow-sm hover:shadow-2xl hover:shadow-zinc-200/50 transition-all hover:-translate-y-1">
                      <Link href={`/notebook?id=${nb.id}`} className="flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-xl border border-zinc-100 shadow-sm group-hover:scale-110 transition-transform duration-500">📓</div>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest shadow-sm">Live</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 mb-1 group-hover:text-blue-600 transition-colors">{nb.name || 'Untitled Notebook'}</h3>
                        <p className="text-[10px] font-medium text-zinc-400 mb-6 flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="inline-block w-1 h-1 bg-zinc-300 rounded-full"></span>
                          Last edited {new Date(nb.updated_at).toLocaleDateString()}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-zinc-50">
                        <span className="text-[9px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">Config Layer</span>
                        <span className="text-[9px] font-bold bg-zinc-50 text-zinc-500 border border-zinc-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">Deployment</span>
                        <div className="ml-auto">
                          <DeleteNotebookButton action={deleteWithId} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* --- Right Margin (Physical Binder Style) --- */}
      <div className="hidden lg:flex w-80 bg-white border-l border-zinc-200 p-8 flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20 h-screen overflow-y-auto relative">
        {/* Binder details mimicking a physical notebook */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-zinc-100 to-transparent"></div>
        <div className="absolute top-12 bottom-12 -left-[5px] flex flex-col justify-between py-8 z-30">
           {[...Array(14)].map((_, i) => (
             <div key={i} className="w-2.5 h-4 bg-[#FAFAFA] border border-zinc-200 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"></div>
           ))}
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-4 mb-10 pl-2 mt-4 relative z-10">
          <div className="w-12 h-12 rounded-[20px] bg-black shadow-lg shadow-black/10 flex items-center justify-center font-bold text-white text-lg">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-900 truncate max-w-[160px]">{user.email}</div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Poysis Premium</div>
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-col gap-1 pl-1 mb-8 relative z-10">
           <Link href="/notebook" className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:text-black hover:bg-zinc-50 rounded-xl transition-all group">
             <span className="bg-zinc-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">📄</span> Active Engine
           </Link>
           <button className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:text-black hover:bg-zinc-50 rounded-xl transition-all group">
             <span className="bg-zinc-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">⚙️</span> Settings
           </button>
        </div>

        <hr className="border-t border-zinc-100 mb-8 relative z-10" />

        {/* Sidebar Mini List */}
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em]">Quick Nav</h3>
             <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-lg text-[9px] font-bold">{(notebooks?.length || 0)}</span>
          </div>
          
          <div className="flex flex-col gap-1 pr-2">
            {notebooks?.slice(0, 5).map(nb => (
              <Link key={nb.id} href={`/notebook?id=${nb.id}`} className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-xl transition-all truncate border border-transparent hover:border-zinc-100 shadow-sm active:scale-95 flex items-center gap-3">
                <span className="text-blue-500 opacity-40">📓</span> {nb.name || 'Untitled'}
              </Link>
            ))}
            <form action={createNotebook}>
              <button type="submit" className="w-full mt-4 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-black transition-all flex items-center gap-3 border border-dashed border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50/50">
                <span className="text-sm">+</span> New Instance
              </button>
            </form>
          </div>
        </div>

        {/* Knowledge Engine Indicator */}
        <div className="mt-8 relative z-10">
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm">
             <div className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-4">Vector Memory</div>
             <div className="flex items-end justify-between mb-2">
                <div className="text-[11px] font-bold text-zinc-500">{docCount || 0} / 50 Docs</div>
                <div className="text-[11px] font-bold text-blue-600">{Math.round(((docCount || 0) / 50) * 100)}%</div>
             </div>
             <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: `${Math.min(((docCount || 0) / 50) * 100, 100)}%` }}></div>
             </div>
          </div>
          
          <form action={logout} className="mt-6">
            <button type="submit" className="w-full py-4 text-[10px] font-black text-zinc-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 group">
               <span className="group-hover:-translate-x-1 transition-transform">🚪</span> Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
