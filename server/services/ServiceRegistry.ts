import fs from 'fs';
import path from 'path';

// NOTE: never use import.meta here. This file ships in a CommonJS bundle where
// import.meta.url is undefined - a previous __filename/__dirname computation on
// it (dead code, used nowhere) crashed all three Cloud Run services at startup.

interface Service {
  name: string;
  status: 'initializing' | 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: number;
  details?: Record<string, any>;
  ready?: () => boolean;
  verify?: () => Promise<boolean>;
}

export class ServiceRegistry {
  private services: Map<string, Service> = new Map();
  private rawServices: Map<string, any> = new Map();
  private waiters: Map<string, Array<() => void>> = new Map();
  private stateFile: string;
  private static instance: ServiceRegistry;

  private constructor() {
    this.stateFile = path.join(process.cwd(), '.service-registry.json');
    this.loadState();
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  private loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        for (const [key, val] of Object.entries(data)) {
          this.services.set(key, val as Service);
        }
      }
    } catch (err) {
      console.warn('[ServiceRegistry] Failed loading state file:', err);
    }
  }

  private saveState() {
    try {
      const stateObj: Record<string, Service> = {};
      for (const [key, val] of this.services.entries()) {
        stateObj[key] = {
          name: val.name,
          status: val.status,
          lastCheck: val.lastCheck,
          details: val.details
        };
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(stateObj, null, 2));
    } catch (err) {
      console.warn('[ServiceRegistry] Failed writing state file:', err);
    }
  }

  /**
   * Reset persistent status on main process start
   */
  resetStateFile() {
    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
        console.log('[ServiceRegistry] Cleaned previous services state file.');
      }
      this.services.clear();
      this.rawServices.clear();
    } catch {
      // Ignored: temporary file cleanup failure is non-blocking
    }
  }

  /**
   * Register a service by name
   */
  register(name: string, service: any) {
    this.rawServices.set(name, service);
    this.services.set(name, {
      name,
      status: 'healthy',
      lastCheck: Date.now(),
      ready: service?.ready || (() => true),
      verify: service?.verify || (async () => true)
    });
    console.log(`[ServiceRegistry] Service "${name}" registered successfully.`);
    this.saveState();

    const list = this.waiters.get(name);
    if (list) {
      this.waiters.delete(name);
      for (const resolve of list) {
        resolve();
      }
    }
  }

  /**
   * Wait for a service to become available
   */
  async waitFor(name: string): Promise<any> {
    if (this.has(name)) {
      return this.get(name);
    }
    return new Promise((resolve) => {
      let list = this.waiters.get(name);
      if (!list) {
        list = [];
        this.waiters.set(name, list);
      }
      list.push(() => {
        resolve(this.get(name));
      });
    });
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.rawServices.has(name) || this.services.has(name);
  }

  /**
   * Get a registered service immediately
   */
  get(name: string): any {
    return this.rawServices.get(name) || this.services.get(name);
  }

  updateHealth(name: string, status: 'initializing' | 'healthy' | 'unhealthy' | 'degraded', details?: Record<string, any>) {
    const service = this.services.get(name);
    if (service) {
      service.status = status;
      service.lastCheck = Date.now();
      if (details) service.details = details;
      this.saveState();
    }
  }

  getHealth(name: string): Service | undefined {
    return this.services.get(name);
  }

  getAllHealth(): Service[] {
    return Array.from(this.services.values());
  }

  async verifyAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, service] of this.services.entries()) {
      if (service.verify) {
        try {
          const ok = await service.verify();
          results[name] = ok;
          this.updateHealth(name, ok ? 'healthy' : 'unhealthy');
        } catch {
          results[name] = false;
          this.updateHealth(name, 'unhealthy');
        }
      } else {
        results[name] = service.status === 'healthy';
      }
    }
    return results;
  }
}

export const registry = ServiceRegistry.getInstance();
export const serviceRegistry = registry;
export default registry;
