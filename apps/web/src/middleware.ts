import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

// Dev-only CORS for /api/*: native mobile requests aren't subject to browser
// CORS, but the Expo *web* target (used for local browser-based smoke
// testing of apps/mobile) is a separate origin and needs this. Gated to
// non-production so the deployed web app's same-origin API is unaffected.
function withDevCors(response: NextResponse) {
  if (process.env.NODE_ENV === "production") return response;
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return response;
}

// Refreshes the Supabase auth cookie on every request so server-rendered
// pages/Route Handlers always see a valid session. Standard @supabase/ssr
// pattern — see https://supabase.com/docs/guides/auth/server-side/nextjs
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return withDevCors(new NextResponse(null, { status: 204 }));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/api/")) return withDevCors(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
