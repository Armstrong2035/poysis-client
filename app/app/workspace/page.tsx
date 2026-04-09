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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: notebooks } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

      <div className="relative max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-900">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            Poysis
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-zinc-500">{user.email}</span>
            <form action={logout}>
              <button type="submit" className="text-sm text-zinc-400 hover:text-red-500 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Hero actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          <form action={createNotebook} className="h-full">
            <button
              type="submit"
              className="group w-full h-full min-h-[200px] rounded-[28px] border-2 border-dashed border-zinc-200 bg-white/60 hover:bg-white hover:border-zinc-400 hover:shadow-xl hover:shadow-zinc-200/50 transition-all p-10 flex flex-col items-start text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center text-2xl mb-6 transition-all group-hover:scale-110 group-hover:text-white">
                +
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Blank canvas</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">Start from scratch and build your own AI pipeline.</p>
            </button>
          </form>

          <Link
            href="/templates"
            className="group min-h-[200px] rounded-[28px] border border-zinc-200 bg-white hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-0.5 transition-all p-10 flex flex-col items-start"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center text-2xl mb-6 transition-all group-hover:scale-110">
              🧩
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Use a template</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">Start from a pre-built pipeline for your use case.</p>
          </Link>
        </div>

        {/* Notebooks */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
              Your Notebooks {notebooks && notebooks.length > 0 && `· ${notebooks.length}`}
            </h2>
            <form action={createNotebook}>
              <button type="submit" className="text-xs font-bold text-zinc-500 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100">
                + New
              </button>
            </form>
          </div>

          {(!notebooks || notebooks.length === 0) ? (
            <div className="py-16 text-center border border-dashed border-zinc-200 rounded-[24px]">
              <p className="text-sm text-zinc-400">No notebooks yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notebooks.map((nb) => {
                const deleteWithId = deleteNotebook.bind(null, nb.id);
                return (
                  <div key={nb.id} className="group relative bg-white rounded-[24px] border border-zinc-200 hover:shadow-lg hover:shadow-zinc-200/50 hover:-translate-y-0.5 transition-all">
                    <Link href={`/notebook?id=${nb.id}`} className="flex flex-col p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl">📓</span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">Live</span>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 mb-1 truncate">{nb.name || 'Untitled Notebook'}</h3>
                      <p className="text-[11px] text-zinc-400">
                        {new Date(nb.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </Link>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteNotebookButton action={deleteWithId} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
