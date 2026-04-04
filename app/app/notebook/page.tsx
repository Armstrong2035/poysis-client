import { createClient } from '../../utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NotebookClient from './NotebookClient';

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check for active session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect("/login");
  }

  // Fetch specific notebook or fallback to first one
  let query = supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', user.id);

  if (id) {
    query = query.eq('id', id);
  }

  const { data: notebook } = await query.maybeSingle();

  // Fetch workspace memory (documents) for THIS user
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <NotebookClient 
      id={id || notebook?.id}
      initialData={notebook} 
      workspaceDocuments={documents || []} 
      user={user}
    />
  );
}
