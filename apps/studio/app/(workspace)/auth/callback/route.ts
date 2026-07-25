import { createClient } from "@/utils/supabase/server";
import { ensureWorkspace } from "@/lib/workspace";
import { landingPathForUser } from "@/lib/uiMode";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // An explicit "next" always wins; otherwise fall back to the user's chosen
  // app, resolved after the session exchange below.
  const explicitNext = searchParams.get("next");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First entry after email confirmation lands here with no workspace yet
      // (signup couldn't create one without a session). Create it now.
      // Idempotent, so recovery/OAuth callbacks that already have one are safe.
      if (data.user) {
        await ensureWorkspace(supabase, data.user.id);
      }

      const next = explicitNext ?? landingPathForUser(data.user);

      const forwardedHost = request.headers.get("x-forwarded-host"); // confirmed with supabase docs
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that the origin is the same as the request origin
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
