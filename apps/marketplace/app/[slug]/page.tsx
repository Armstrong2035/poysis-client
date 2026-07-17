import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNotebookBySlug } from "@/lib/actions";
import { ChatScreen } from "@/components/marketplace/ChatScreen";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

// A published notebook is marketplace-visible only if its owner marked it
// public — same gate the listing queries apply.
function isPublic(notebook: { config: any }): boolean {
  return (notebook.config?.canvas?.ceiling ?? "private") === "public";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notebook = await getNotebookBySlug(slug);
  if (!notebook || !isPublic(notebook)) return {};
  const title = notebook.config?.theme?.appLabel ?? notebook.name ?? "Notebook";
  return { title: `${title} — Poysis` };
}

export default async function NotebookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q } = await searchParams;

  const notebook = await getNotebookBySlug(slug);
  if (!notebook || !isPublic(notebook)) notFound();

  const theme = notebook.config?.theme ?? {};
  const activeBlocks: any[] = notebook.config?.activeBlocks ?? [];
  const chatBlock = activeBlocks.find(
    (b: any) => b.blockTypeId === "chat" || b.blockTypeId === "generate" || b.blockTypeId === "search",
  );

  return (
    <ChatScreen
      notebookId={notebook.id}
      allowedSources={chatBlock?.sources?.length > 0 ? chatBlock.sources : undefined}
      appLabel={theme.appLabel ?? notebook.name ?? "Notebook"}
      primaryColor={theme.primaryColor ?? "#3C4A3A"}
      backgroundColor={theme.backgroundColor ?? "#ffffff"}
      borderRadius={theme.borderRadius ?? "12px"}
      showBanner={theme.showBanner ?? true}
      initialQuery={q}
    />
  );
}
