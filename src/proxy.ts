import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const commanderPaths = ["/comando"];
const crewPaths = ["/tripulante"];

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (!token && (commanderPaths.some((path) => pathname.startsWith(path)) || crewPaths.some((path) => pathname.startsWith(path)))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token?.role === "COMMANDER" && pathname.startsWith("/tripulante")) {
    return NextResponse.redirect(new URL("/comando", request.url));
  }

  if (token?.role === "CREW_MEMBER" && pathname.startsWith("/comando")) {
    return NextResponse.redirect(new URL("/tripulante", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/comando/:path*", "/tripulante/:path*"],
};