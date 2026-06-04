import { createClient } from "../../../../utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceClient } from "../WorkspaceClient";

type BotRecommendation = {
  id: string;
  name: string;
  description: string;
  basedOn: string;
  docCount: number;
  category: "chatbot" | "search" | "assistant" | "analyzer";
  confidence: "high" | "medium";
};

function getMockRecommendations(): BotRecommendation[] {
  return [
    {
      id: "r1",
      name: "Onboarding Assistant",
      description: "Answers new hire questions using HR policies, role guides, and process docs.",
      basedOn: "People & Processes",
      docCount: 38,
      category: "chatbot",
      confidence: "high",
    },
    {
      id: "r2",
      name: "Engineering Runbook Bot",
      description: "Retrieves deployment steps, incident playbooks, and architecture decisions on demand.",
      basedOn: "Architecture & Systems",
      docCount: 61,
      category: "assistant",
      confidence: "high",
    },
    {
      id: "r3",
      name: "Product FAQ Search",
      description: "Lets customers or teammates search product specs, roadmap, and release notes.",
      basedOn: "Product & Design",
      docCount: 44,
      category: "search",
      confidence: "medium",
    },
  ];
}

export default async function PlaygroundsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: notebooks } = await supabase
    .from("notebooks")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <WorkspaceClient
      notebooks={notebooks ?? []}
      recommendations={getMockRecommendations()}
    />
  );
}
