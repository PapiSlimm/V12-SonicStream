/**
 * V12 ECOSYSTEM BUS — the interconnect layer shared by every app in the
 * Urban Visions ecosystem (V12 core, SonicStream, and future apps: Headless
 * Financial, CEOS, One Click Page).
 *
 * Design rules (set by ownership):
 *   1. Apps authenticate to each other with signed service tokens — never raw
 *      shared secrets on the wire, never unauthenticated calls.
 *   2. AUDIENCE ISOLATION: a token minted for one app is REJECTED by every
 *      other app. An agent/worker inside SonicStream cannot replay its token
 *      against V12 core. Cross-app calls require a token minted for that
 *      exact destination.
 *   3. SCOPES: tokens carry explicit scopes. Private data never moves without
 *      a scope that authorizes it ("user:handoff", "data:read", ...). Default
 *      scope is "ping" — connectivity only.
 *   4. Ecosystem apps protect each other from the outside; they do not get a
 *      free pass to each other's internals.
 *
 * Zero dependencies — node:crypto HMAC-SHA256, same discipline as the V12
 * core token module. Copy this file verbatim into each app.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface ServiceClaims {
  /** issuing app id, e.g. "v12-core" */
  iss: string;
  /** destination app id — enforced on receipt */
  aud: string;
  /** explicit authorizations, e.g. ["ping"], ["user:handoff"] */
  scope: string[];
  /** optional payload (kept small; e.g. user handoff profile) */
  data?: Record<string, unknown>;
  iat: number;
  exp: number;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (data: string, secret: string) =>
  createHmac("sha256", secret).update(data).digest("base64url");

export function signServiceToken(
  secret: string,
  claims: { iss: string; aud: string; scope: string[]; data?: Record<string, unknown> },
  opts: { ttlSeconds?: number; now?: number } = {},
): string {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const payload: ServiceClaims = {
    iss: claims.iss,
    aud: claims.aud,
    scope: claims.scope,
    ...(claims.data ? { data: claims.data } : {}),
    iat: now,
    exp: now + (opts.ttlSeconds ?? 60), // short-lived by default
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "V12-SVC" }));
  const body = b64url(JSON.stringify(payload));
  return `${header}.${body}.${sign(`${header}.${body}`, secret)}`;
}

export class EcosystemAuthError extends Error {
  constructor(public code: "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" | "WRONG_AUDIENCE" | "MISSING_SCOPE", message: string) {
    super(message);
  }
}

export function verifyServiceToken(
  secret: string,
  token: string,
  expected: { aud: string; scope?: string; now?: number },
): ServiceClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new EcosystemAuthError("MALFORMED", "Malformed service token");
  const [header, body, sig] = parts as [string, string, string];
  const want = Buffer.from(sign(`${header}.${body}`, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) {
    throw new EcosystemAuthError("BAD_SIGNATURE", "Service token signature invalid");
  }
  let claims: ServiceClaims;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new EcosystemAuthError("MALFORMED", "Malformed service token payload");
  }
  const now = expected.now ?? Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    throw new EcosystemAuthError("EXPIRED", "Service token expired");
  }
  // AUDIENCE ISOLATION — the core safeguard.
  if (claims.aud !== expected.aud) {
    throw new EcosystemAuthError(
      "WRONG_AUDIENCE",
      `Token audience "${claims.aud}" is not this app ("${expected.aud}"). Cross-app replay refused.`,
    );
  }
  if (expected.scope && !claims.scope?.includes(expected.scope)) {
    throw new EcosystemAuthError("MISSING_SCOPE", `Token lacks required scope "${expected.scope}"`);
  }
  return claims;
}

/** Outbound helper: call a peer's ecosystem endpoint with a scoped token. */
export async function callPeer(args: {
  secret: string;
  selfId: string;
  peerId: string;
  peerBaseUrl: string;
  path: string; // e.g. "/api/ecosystem/ping"
  scope?: string[];
  data?: Record<string, unknown>;
  fetchImpl?: typeof fetch;
}): Promise<{ status: number; body: any }> {
  const token = signServiceToken(args.secret, {
    iss: args.selfId,
    aud: args.peerId,
    scope: args.scope ?? ["ping"],
    data: args.data,
  });
  const f = args.fetchImpl ?? fetch;
  const res = await f(`${args.peerBaseUrl.replace(/\/$/, "")}${args.path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-v12-service-token": token },
    body: JSON.stringify({}),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
