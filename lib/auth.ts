import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "studio_ieptec_admin";
const SESSION_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  scope: "admin";
  exp: number;
  sid: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET deve ser configurada com pelo menos 32 caracteres.",
    );
  }
  return secret;
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminSession() {
  const payload: SessionPayload = {
    scope: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    sid: randomUUID(),
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

// export function verifyAdminCode(code: string) {
//   const expected = process.env.ADMIN_APPROVAL_CODE;
//   if (!expected) throw new Error("ADMIN_APPROVAL_CODE não foi configurada.");
//   const actualBuffer = Buffer.from(code);
//   const expectedBuffer = Buffer.from(expected);
//   return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
// }

export function verifyAdminCode(code: string) {
  const expected = process.env.ADMIN_APPROVAL_CODE;

  if (!expected) {
    console.error("[admin-auth] ADMIN_APPROVAL_CODE não carregado");
    throw new Error("ADMIN_APPROVAL_CODE não foi configurada.");
  }

  const actualBuffer = Buffer.from(code);
  const expectedBuffer = Buffer.from(expected);

  const sameLength = actualBuffer.length === expectedBuffer.length;
  const matches = sameLength && timingSafeEqual(actualBuffer, expectedBuffer);

  console.log("[admin-auth] diagnóstico", {
    codigoRecebidoTamanho: code.length,
    codigoEsperadoTamanho: expected.length,
    mesmoTamanho: sameLength,
    corresponde: matches,
    recebeuEspacosExternos: code !== code.trim(),
    recebeuAspasExternas: /^['"]|['"]$/.test(code),
    esperadoTemEspacosExternos: expected !== expected.trim(),
    esperadoTemAspasExternas: /^['"]|['"]$/.test(expected),
  });

  return matches;
}

export function verifyAdminSession(
  token: string | undefined,
): SessionPayload | null {
  if (!token) return null;
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return null;
  const expectedSignature = sign(encoded);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  )
    return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (
      payload.scope !== "admin" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  return verifyAdminSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export function sessionCookieOptions() {
  const publicHttpsContext = Boolean(
    process.env.MANUS_PROJECT_ID ||
    process.env.VERCEL ||
    process.env.VERCEL_URL,
  );
  return {
    httpOnly: true,
    secure: publicHttpsContext,
    sameSite: publicHttpsContext ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export function hasTrustedRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
