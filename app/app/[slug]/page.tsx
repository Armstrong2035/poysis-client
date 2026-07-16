import { cache } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { getNotebookBySlug } from "@/lib/actions";
import { PlaygroundView } from "./PlaygroundView";

interface Props {
  params: Promise<{ slug: string }>;
}

// Deduped via React's per-request cache so generateMetadata and the page
// body share one lookup instead of querying twice for the same request.
const getNotebook = cache(getNotebookBySlug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notebook = await getNotebook(slug);
  if (!notebook) return {};
  const appLabel = notebook.config?.theme?.appLabel ?? notebook.name ?? "Playground";
  return { title: appLabel };
}

export default async function PlaygroundPage({ params }: Props) {
  const { slug } = await params;

  const notebook = await getNotebook(slug);
  if (!notebook) notFound();

  const config = notebook.config ?? {};
  const theme = config.theme ?? {};
  const activeBlocks: any[] = config.activeBlocks ?? [];

  // Only public notebooks skip the login wall — private/team ones still
  // require a session, since ceiling is what actually governs who can
  // reach this notebook's contents (see lib/ceiling.ts).
  const ceiling = config.canvas?.ceiling ?? "private";
  if (ceiling !== "public") {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=/${slug}`);
  }

  // Find the first chat, generate, or search block to power the playground
  // chat. Search notebooks (from Canvas) render through the same chat UI for
  // now — the critical part is that their sources still scope retrieval;
  // without this, a published search notebook would fall through with no
  // allowedSources at all.
  const chatBlock = activeBlocks.find(
    (b: any) =>
      b.blockTypeId === "chat" ||
      b.blockTypeId === "generate" ||
      b.blockTypeId === "search"
  );

  return (
    <PlaygroundView
      notebookId={notebook.id}
      ownerId={notebook.user_id}
      appLabel={theme.appLabel ?? notebook.name ?? "Playground"}
      primaryColor={theme.primaryColor ?? "#000000"}
      backgroundColor={theme.backgroundColor ?? "#ffffff"}
      borderRadius={theme.borderRadius ?? "12px"}
      allowedSources={chatBlock?.sources?.length > 0 ? chatBlock.sources : undefined}
      showBanner={theme.showBanner ?? true}
    />
  );
}
