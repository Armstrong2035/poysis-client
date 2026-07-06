import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import { getNotebookBySlug } from "@/lib/actions";
import { PlaygroundView } from "./PlaygroundView";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PlaygroundPage({ params }: Props) {
  const { slug } = await params;

  const notebook = await getNotebookBySlug(slug);
  if (!notebook) notFound();

  // End users must be authenticated — redirect to login if not.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/p/${slug}`);

  const config = notebook.config ?? {};
  const theme = config.theme ?? {};
  const activeBlocks: any[] = config.activeBlocks ?? [];

  // Find the first chat or generate block to power the playground chat.
  const chatBlock = activeBlocks.find(
    (b: any) => b.blockTypeId === "chat" || b.blockTypeId === "generate"
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
