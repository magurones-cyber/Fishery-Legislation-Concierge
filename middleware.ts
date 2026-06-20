import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CURRENT_PRIVACY_POLICY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/privacy/consent";

const PUBLIC_PATHS = ["/login", "/terms", "/privacy", "/auth/callback"];
const CONSENT_EXEMPT_PATHS = ["/consent", "/auth/set-password", "/auth/signout"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    if (request.nextUrl.pathname === "/login") return response;
    return redirectWithCookies(request, response, "/login", "configuration");
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isConsentExempt = CONSENT_EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!user && !isPublic) {
    const next = `${pathname}${request.nextUrl.search}`;
    return redirectWithCookies(request, response, "/login", undefined, next);
  }

  if (!user) return response;

  if (pathname === "/login") {
    return redirectWithCookies(request, response, "/dashboard");
  }

  if (isPublic || isConsentExempt) return response;

  const { data: consent } = await supabase
    .from("user_consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("terms_version", CURRENT_TERMS_VERSION)
    .eq("privacy_policy_version", CURRENT_PRIVACY_POLICY_VERSION)
    .eq("log_analysis_consent", true)
    .eq("consented", true)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (!consent) {
    return redirectWithCookies(request, response, "/consent");
  }

  return response;
}

function redirectWithCookies(request: NextRequest, source: NextResponse, pathname: string, error?: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (error) url.searchParams.set("error", error);
  if (next) url.searchParams.set("next", next);
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|api/).*)"]
};
