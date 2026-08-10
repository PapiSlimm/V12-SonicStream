import { Request, Response, NextFunction } from 'express';

export const canaryMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 5% traffic to canary
  const isCanary = Math.random() < 0.05;
  (req as any).isCanary = isCanary;
  
  // In a real scenario, you might route to a different backend service.
  // Here we just flag it for monitoring and potentially different logic.
  if (isCanary) {
    res.setHeader('X-Sonic-Version', 'canary');
  } else {
    res.setHeader('X-Sonic-Version', 'main');
  }
  
  next();
};
