import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, hasTrustedRequestOrigin, SESSION_COOKIE, sessionCookieOptions, verifyAdminCode } from "@/lib/auth";
import { clearRateLimit, enforceRateLimit, getClientKey } from "@/lib/rate-limit";
import { adminCodeSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
  }
  const key = `admin-login:${getClientKey(request)}`;
  const limit = enforceRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: `Muitas tentativas. Tente novamente em ${limit.retryAfter} segundos.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const parsed = adminCodeSchema.safeParse(await request.json());
    if (!parsed.success || !verifyAdminCode(parsed.data.code)) {
      return NextResponse.json({ message: "Código administrativo inválido." }, { status: 401 });
    }

    clearRateLimit(key);
    const response = NextResponse.json({ message: "Acesso administrativo liberado." });
    response.cookies.set(SESSION_COOKIE, createAdminSession(), sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ message: "Não foi possível validar o acesso administrativo." }, { status: 500 });
  }
}
