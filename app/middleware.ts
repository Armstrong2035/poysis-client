import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Supabase Auth Middleware (Transparent Session Refresher)
 * - Refreshes the session on every request to keep cookies alive.
 * - DOES NOT redirect. Redirection is handled by individual Server Components
 *   (e.g., in /notebook/page.tsx) to avoid breaking Server Actions and public routes.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // If env vars are missing (e.g. during cold start or misconfigured deployment),
  // pass the request through rather than crashing every route.
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[middleware] Supabase env vars missing — skipping session refresh.");
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refreshes the session — vital for SSR and keeps the user logged in for Server Actions
    await supabase.auth.getUser();
  } catch (err) {
    console.error("[middleware] Session refresh failed:", err);
    // Still pass the request through — auth will be handled per-page
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
