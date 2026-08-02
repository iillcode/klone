import { jwtVerify, importJWK } from "jose";

export interface AuthUser {
  sub: string;
  email?: string;
  role?: string;
}

async function fetchJWKS(jwksUrl: string) {
  const res = await fetch(jwksUrl);
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);
  const { keys } = (await res.json()) as { keys: any[] };
  return keys;
}

async function getKeyFromJWKS(jwksUrl: string, token: string) {
  const header = JSON.parse(atob(token.split(".")[0]!));
  const keys = await fetchJWKS(jwksUrl);
  const jwk = keys.find(
    (k: any) => k.kid === header.kid && k.alg === header.alg,
  );
  if (!jwk) throw new Error("No matching key found in JWKS");
  return importJWK(jwk, jwk.alg);
}

export async function validateJWT(
  token: string,
  jwksUrl: string,
): Promise<AuthUser | null> {
  try {
    const key = await getKeyFromJWKS(jwksUrl, token);
    const { payload } = await jwtVerify(token, key);
    return {
      sub: payload.sub ?? "",
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
    };
  } catch {
    return null;
  }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
