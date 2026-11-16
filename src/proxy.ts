import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/** Pages anyone may open: the public portal for applicants, plus the password-reset flow and gateway callbacks. */
const PUBLIC_EXACT = new Set(["/", "/login", "/apply", "/status", "/forgot-password"]);
const PUBLIC_PREFIX = ["/apply/", "/status/", "/pay/", "/reset-password/", "/api/pay/"];

const isPublic = (path: string) => PUBLIC_EXACT.has(path) || PUBLIC_PREFIX.some((p) => path.startsWith(p));

/** Optimistic gate: everything else needs a session. Real authorization happens in each page/action. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
