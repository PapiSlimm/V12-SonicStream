import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration } from './metrics.js';

export function normalizeRoute(req: Request): string {
  // Try using Express route path first
  if (req.route?.path) {
    const fullPath = req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
    return fullPath;
  }

  // Fallback to normalized paths (stripping IDs/UUIDs to prevent high cardinality)
  let path = req.path || 'unknown';

  // 1. Target UUIDs
  path = path.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ':id');

  // 2. Target standard auto-increment integers/digits representing IDs
  path = path.replace(/\/\d+(?=\/|$)/g, '/:id');

  // 3. Target customary MongoIDs / 24-character hexadecimal hashes
  path = path.replace(/\b[0-9a-fA-F]{24}\b/g, ':id');

  // 4. Target standard prefixed entity IDs (e.g., usr_xxx, trk_yyy, job_zzz)
  path = path.replace(/\b(usr|trk|job|sh|rel|pl|rm|msg|tx|art|pay)_[a-zA-Z0-9]+\b/g, ':id');

  return path;
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const version = (req as any).isCanary ? 'canary' : 'main';

  // Use res.once to avoid memory leak risks in long-lived streams/websockets/SSE
  res.once('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = normalizeRoute(req);
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode,
        version
      },
      duration
    );
  });

  next();
}
