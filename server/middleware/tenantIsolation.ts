import { Response, NextFunction } from 'express';
import { AuthRequest } from '../domains/identity/auth.js';

/**
 * Middleware enforcing Multi-Tenant Isolation.
 * Ensures users can only access data belonging to their assigned tenant.
 */
export const enforceTenantIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // 1. Resolve target tenant context
  const headerTenantId = req.headers['x-tenant-id'] as string;
  const bodyTenantId = req.body?.tenantId || req.body?.tenant_id;
  const queryTenantId = req.query?.tenantId || req.query?.tenant_id as string;

  const resolvedTenantId = headerTenantId || bodyTenantId || queryTenantId || 'default';

  // 2. Identify the user's own tenant
  const userTenantId = req.user.tenantId || 'default';

  // Admins can bypass isolation to manage global issues / platform state
  if (req.user.userType === 'admin') {
    // Inject tenant id if missing
    req.headers['x-tenant-id'] = resolvedTenantId;
    return next();
  }

  // 3. Compare user's tenant with the requested tenant context
  if (resolvedTenantId !== 'default' && userTenantId !== 'default' && resolvedTenantId !== userTenantId) {
    return res.status(403).json({
      error: 'Forbidden: Multi-tenant isolation failure. You cannot access data across tenant boundaries.'
    });
  }

  // 4. Force override tenant variables to user's authorized tenant to force isolation safety
  if (req.body && (req.body.tenantId || req.body.tenant_id)) {
    if (req.body.tenantId) req.body.tenantId = userTenantId;
    if (req.body.tenant_id) req.body.tenant_id = userTenantId;
  }
  if (req.query) {
    if (req.query.tenantId) req.query.tenantId = userTenantId;
    if (req.query.tenant_id) req.query.tenant_id = userTenantId;
  }

  // Set the resolved tenant ID safe in request headers
  req.headers['x-tenant-id'] = userTenantId;

  next();
};
