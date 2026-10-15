import { NextRequest, NextResponse } from "next/server";
import { workspaceSlugFromHost } from "@/lib/tenant-host";
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get("host") ?? "";
  const slug = workspaceSlugFromHost(host);
  if (slug && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/w/${slug}`;
    return NextResponse.rewrite(url);
  }
  if (pathname.startsWith("/w/") && !req.cookies.has("synchq_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/w/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
};
