/**
 * Ecosystem endpoints — how other V12 apps talk to SonicStream.
 * Every route requires a valid service token minted FOR this app (aud check),
 * carrying the right scope. See ecosystem/bus.ts for the rules.
 */
import { Router, type Request, type Response, type NextFunction } from "express";
import { verifyServiceToken, EcosystemAuthError, type ServiceClaims } from "../../ecosystem/bus.ts";
import { config } from "../config.ts";
import jwt from "jsonwebtoken";
import prisma from "../db/client.ts";

const router = Router();

interface EcoRequest extends Request {
  svc?: ServiceClaims;
}

function requireServiceToken(scope: string) {
  return (req: EcoRequest, res: Response, next: NextFunction) => {
    const cfg = config();
    if (!cfg.ecosystemSecret) {
      return res.status(503).json({ error: "ecosystem_disabled", message: "ECOSYSTEM_SECRET not configured" });
    }
    const token = req.headers["x-v12-service-token"];
    if (typeof token !== "string" || !token) {
      return res.status(401).json({ error: "no_service_token" });
    }
    try {
      req.svc = verifyServiceToken(cfg.ecosystemSecret, token, { aud: cfg.appId, scope });
      next();
    } catch (err) {
      const code = err instanceof EcosystemAuthError ? err.code : "INVALID";
      return res.status(403).json({ error: "service_token_rejected", code });
    }
  };
}

/** Connectivity + identity handshake. Scope: "ping". */
router.post("/ping", requireServiceToken("ping"), (req: EcoRequest, res) => {
  res.json({
    ok: true,
    app: config().appId,
    from: req.svc!.iss,
    time: new Date().toISOString(),
    message: `SonicStream acknowledges ${req.svc!.iss}. Ecosystem link healthy.`,
  });
});

/**
 * SSO hand-off: a signed-in V12-core user arrives with a handoff token and
 * gets a local SonicStream session without re-registering. Scope: "user:handoff".
 * The user is created on first arrival (email is the ecosystem identity key).
 */
router.post("/handoff", requireServiceToken("user:handoff"), async (req: EcoRequest, res) => {
  const profile = req.svc!.data as { email?: string; name?: string } | undefined;
  if (!profile?.email) {
    return res.status(400).json({ error: "missing_profile", message: "handoff token must carry { email, name }" });
  }
  const email = String(profile.email).toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name ?? email.split("@")[0],
        // Ecosystem accounts authenticate via handoff, not local password.
        password: `ecosystem:${Date.now()}:${Math.random().toString(36).slice(2)}`,
      },
    });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, config().jwtSecret, { expiresIn: "7d" });
  res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

export default router;
