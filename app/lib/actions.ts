"use server";

import { createClient } from "../utils/supabase/server";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Saves or updates a notebook configuration in Supabase.
 */
export async function saveNotebook(id: string, config: any) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Name lives in config — extract it to keep the 'name' column in sync for dashboard queries
  const { name, ...rest } = config;

  const updatePayload = { 
    id, 
    name: name || 'Untitled Notebook',
    config: rest,
    user_id: user.id,
    updated_at: new Date().toISOString() 
  };

  console.log(`>>> [SERVER ACTION] Saving notebook ${id} with name: "${updatePayload.name}"`);

  const { data, error } = await supabase
    .from('notebooks')
    .upsert(updatePayload)
    .select();

  if (error) {
    console.error("Error saving notebook:", error.message);
    throw new Error(error.message);
  }

  revalidatePath('/notebook');
  revalidatePath('/workspace');
  revalidatePath('/', 'layout');
  return data;
}

/**
 * Dedicated action to rename a notebook. Only touches the 'name' column.
 */
export async function renameNotebook(id: string, name: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  console.log(`>>> [SERVER ACTION] Renaming notebook ${id} to: "${name}"`);

  const { error } = await supabase
    .from('notebooks')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id); // RLS double-check

  if (error) {
    console.error("Error renaming notebook:", error.message);
    throw new Error(error.message);
  }

  revalidatePath('/workspace');
  revalidatePath('/', 'layout');
}

/**
 * Silent version of createNotebook that returns the data instead of redirecting.
 * Used for background bootstrapping during ingestion.
 */
export async function initializeNotebook(config: any) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { name, ...rest } = config;

  console.log(`>>> [SERVER ACTION] Initializing notebook with name: "${name}"`);

  const { data, error } = await supabase
    .from('notebooks')
    .insert({ 
      user_id: user.id,
      name: name || 'Untitled Notebook',
      config: rest
    })
    .select()
    .single();

  if (error) {
    console.error("Error initializing notebook:", error.message);
    throw new Error(error.message);
  }

  revalidatePath('/workspace');
  revalidatePath('/');
  return data;
}

/**
 * Creates a new notebook and returns its ID.
 */
export async function createNotebook() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('notebooks')
    .insert({ 
      user_id: user.id,
      name: 'Untitled Notebook',
      config: { activeBlocks: [], blocks: {}, uiComponents: {} }
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notebook:", error.message);
    throw new Error(error.message);
  }

  revalidatePath('/workspace');
  revalidatePath('/');
  return redirect(`/notebook?id=${data.id}`);
}

/**
 * Adds a document record to the Workspace Memory (global corpus).
 */
export async function addDocumentRecord(document: any) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('documents')
    .insert([{ ...document, user_id: user.id }])
    .select();

  if (error) {
    console.error("Error adding document:", error.message);
    throw new Error(error.message);
  }

  revalidatePath('/notebook');
  return data;
}

/**
 * Uploads a file to Supabase Storage and inserts a record into 'documents'.
 */
export async function uploadDocument(formData: FormData) {
  console.log(">>> [SERVER ACTION] uploadDocument hit");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get('file') as File;
  if (!file) {
    console.error(">>> [SERVER ACTION] No file in payload");
    throw new Error("No file provided");
  }

  console.log(`>>> [SERVER ACTION] Uploading file: ${file.name} (${file.size} bytes) for user: ${user.id}`);

  const filePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

  // 1. Upload to Supabase Storage
  console.log(`>>> [SERVER ACTION] Attempting upload to bucket: 'documents' at path: ${filePath}`);
  const { data: storageData, error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (storageError) {
    console.error(">>> [SERVER ACTION] Storage Error:", storageError.message);
    throw new Error(`Storage Error: ${storageError.message}`);
  }

  console.log(">>> [SERVER ACTION] Storage upload successful:", storageData.path);

  // 2. Map file extension to type
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const fileType = ext === 'pdf' ? 'pdf' 
    : (['xlsx', 'csv', 'xls'].includes(ext)) ? 'spreadsheet' 
    : 'other';

  // 3. Insert record into database
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      name: file.name,
      file_type: fileType,
      storage_path: storageData.path,
      user_id: user.id,
      status: 'indexed',
      metadata: { size: file.size, type: file.type }
    }])
    .select();

  if (error) {
    console.error("Database Error:", error.message);
    throw new Error(`Database Error: ${error.message}`);
  }

  revalidatePath('/notebook');
  return data;
}

/**
 * Fetches a single notebook by ID (authenticated — for the builder).
 */
export async function getNotebook(id: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error("Error fetching notebook:", error.message);
    return null;
  }

  return data;
}

/**
 * Fetches a notebook's public config by ID (NO auth required).
 * Used by the /preview page and embed widget so end-users can view
 * shared copilots without logging in.
 *
 * Returns only the fields needed to render the preview — never exposes
 * user_id or other sensitive columns.
 */
export async function getPublicNotebook(id: string) {
  const supabase = createPublicClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  );

  const { data, error } = await supabase
    .from('notebooks')
    .select('id, name, config')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching public notebook:", error.message);
    return null;
  }

  return data;
}

/**
 * Deletes a notebook by ID.
 */
export async function deleteNotebook(id: string) {
  console.log(`>>> [deleteNotebook] Called with id: "${id}"`);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log(`>>> [deleteNotebook] User: ${user?.id ?? "null"} | Auth error: ${authError?.message ?? "none"}`);

  if (!user) throw new Error("Unauthorized");

  const { error, count } = await supabase
    .from('notebooks')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id);

  console.log(`>>> [deleteNotebook] Result — error: ${error?.message ?? "none"} | rows affected: ${count}`);

  if (error) throw new Error(error.message);
  if (count === 0) throw new Error(`RLS_BLOCK: 0 rows deleted for id=${id} user=${user.id}`);

  revalidatePath('/workspace');
  revalidatePath('/');
}
