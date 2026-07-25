import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Source_Serif_4, Albert_Sans } from "next/font/google";
import { createClient } from "../../../utils/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";
import { isEnterpriseEntitled } from "@/lib/uiMode";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { ConsolidationProvider } from "./ConsolidationContext";
import { MockPermissionsProvider } from "./MockPermissionsContext";
import { NotebooksProvider, type NotebookRow } from "./NotebooksContext";
import { OnboardingProvider } from "./OnboardingContext";

const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-source-serif" });
const albertSans = Albert_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-albert-sans" });

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Enterprise (this whole workspace app) is a paid tier and locked for now.
  // Gate the entire route tree here — every /workspace/* page renders through
  // this layout, so a non-entitled user can't reach any of it by URL. They go
  // to Creator Studio instead.
  if (!isEnterpriseEntitled(user)) return redirect("/studio");

  // Safety net: guarantee the user has a workspace on first entry to the app,
  // regardless of which auth path confirmed them. The /auth/callback creates
  // one too, but email confirmation can land here without flowing through it
  // (Supabase /verify redirects straight to the app), which would otherwise
  // leave the user workspace-less and 404ing on every worker route. Idempotent.
  await ensureWorkspace(supabase, user.id);

  const { data: notebookRows, error: notebookRowsError } = await supabase
    .from("notebooks")
    .select("id, name, slug, config, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (notebookRowsError) {
    // Was previously silently swallowed — a failed fetch here (RLS, transient
    // error) looked identical to "you have no notebooks," which is exactly
    // the kind of bug that makes real data look like it isn't persisting.
    console.error("[WorkspaceLayout] Failed to fetch notebooks:", notebookRowsError.message);
  }

  return (
    <ConsolidationProvider>
      <MockPermissionsProvider>
        <NotebooksProvider initial={(notebookRows ?? []) as NotebookRow[]}>
          <OnboardingProvider>
            <div
              className={`${sourceSerif.variable} ${albertSans.variable}`}
              style={{
                display: "flex",
                height: "100vh",
                background: "#F1EEE2",
                overflow: "hidden",
                color: "#262922",
                fontFamily: "var(--font-albert-sans), sans-serif",
              }}
            >
              <WorkspaceSidebar email={user.email ?? ""} />
              <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
                {children}
              </main>
            </div>
          </OnboardingProvider>
        </NotebooksProvider>
      </MockPermissionsProvider>
    </ConsolidationProvider>
  );
}
