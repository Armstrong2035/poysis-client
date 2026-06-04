import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { ConsolidationProvider } from "./ConsolidationContext";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  return (
    <ConsolidationProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#0A0B0F",
          overflow: "hidden",
          color: "#E8E9ED",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <WorkspaceSidebar email={user.email ?? ""} />
        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {children}
        </main>
      </div>
    </ConsolidationProvider>
  );
}
