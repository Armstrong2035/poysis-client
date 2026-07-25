import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Source_Serif_4, Hanken_Grotesk } from "next/font/google";
import { createClient } from "../../../utils/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";
import { ConsolidationProvider } from "../workspace/ConsolidationContext";
import { MockPermissionsProvider } from "../workspace/MockPermissionsContext";
import { NotebooksProvider, type NotebookRow } from "../workspace/NotebooksContext";
import { OnboardingProvider } from "../workspace/OnboardingContext";

// Studio uses the brand pairing from the design handoff: Source Serif 4 for
// titles/wordmark, Hanken Grotesk for UI/body. Kept local to this route so the
// rest of the app's typography is untouched.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-serif",
});
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
});

/**
 * Creator Studio — the full-viewport three-panel notebook builder (Sources ·
 * Test & Chat · Notebook config). Deliberately a sibling of /workspace rather
 * than a child, so it does NOT inherit the workspace sidebar: the design is a
 * standalone app that owns the whole viewport. It still needs the same data
 * providers the workspace uses, so those are re-established here.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Same first-entry safety net as the workspace layout: guarantee a workspace
  // exists so worker routes (chat, youtube) don't 404.
  await ensureWorkspace(supabase, user.id);

  const { data: notebookRows, error: notebookRowsError } = await supabase
    .from("notebooks")
    .select("id, name, slug, config, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (notebookRowsError) {
    console.error("[StudioLayout] Failed to fetch notebooks:", notebookRowsError.message);
  }

  return (
    <ConsolidationProvider>
      <MockPermissionsProvider>
        <NotebooksProvider initial={(notebookRows ?? []) as NotebookRow[]}>
          <OnboardingProvider>
            <div
              className={`${sourceSerif.variable} ${hankenGrotesk.variable}`}
              style={{
                height: "100vh",
                overflow: "hidden",
                background: "#FBF9F3",
                color: "#23261F",
                fontFamily: "var(--font-hanken), system-ui, sans-serif",
              }}
            >
              {children}
            </div>
          </OnboardingProvider>
        </NotebooksProvider>
      </MockPermissionsProvider>
    </ConsolidationProvider>
  );
}
