import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../../../utils/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { DashboardChat } from "./DashboardChat";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const workspaceId = await getWorkspaceId(supabase, user.id);
  if (!workspaceId) return redirect("/workspace");

  return <DashboardChat workspaceId={workspaceId} />;
}
