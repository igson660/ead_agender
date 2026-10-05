import { NextRequest, NextResponse } from "next/server";
import { hasTrustedRequestOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
  }
  const response = NextResponse.json({ message: "Sessão encerrada." });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
