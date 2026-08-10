import { EventEmitter } from 'events';
import { serviceRegistry } from './ServiceRegistry.js';

export const EVENTS = {
  // Identity
  USER_REGISTERED:       'user.registered',
  USER_VERIFIED:         'user.verified',

  // Finance
  PAYMENT_SUCCEEDED:     'payment.succeeded',
  PAYMENT_FAILED:        'payment.failed',          // ← was missing, crashes webhooks.ts
  SUBSCRIPTION_CANCELLED:'subscription.cancelled',  // ← was missing, crashes webhooks.ts
  PAYOUT_CREATED:        'payout.created',
  FRAUD_DETECTED:        'fraud.detected',
  ROYALTY_PROCESSED:     'royalty.processed',
  SALE_COMPLETED:        'sale.completed',

  // Social
  POST_CREATED:          'post.created',
  POST_LIKED:            'post.liked',
  ROOM_JOINED:           'room.joined',

  // Music
  TRACK_PLAYED:          'track.played',
  TRACK_APPROVED:        'track.approved',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];

class EventBus extends EventEmitter {
  private hasSubscribedRedis = false;

  private setupRedisSubscription(redis: any) {
    if (this.hasSubscribedRedis) return;
    try {
      if (redis && typeof redis.duplicate === 'function') {
        const sub = redis.duplicate();
        sub.on('message', (channel: string, message: string) => {
          if (channel === 'sonicstream:events') {
            try {
              const { event, payload } = JSON.parse(message);
              // Trigger local super emitter, bypassing recursive Redis publishes
              super.emit(event, payload);
            } catch (err) {
              // Parse error
            }
          }
        });
        sub.subscribe('sonicstream:events').then(() => {
          this.hasSubscribedRedis = true;
          console.log('[EventBus] Distributed Redis Event Bus channels online.');
        }).catch((err: any) => {
          console.warn('[EventBus] Failed to subscribe to Redis events stream:', err.message);
        });
      }
    } catch (err: any) {
      console.warn('[EventBus] Error setup for Redis event subscription duplication:', err.message);
    }
  }

  /**
   * Emit a typed platform event.
   * In a production multi-instance setup, broadcast to Redis channels
   * so all Cloud Run instances receive it synchronously.
   */
  emit(event: string, payload: any): boolean {
    const timestamp = new Date().toISOString();
    const eventId   = `ev_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[EventBus] ${event} [${eventId}] @ ${timestamp}`);

    const redis = serviceRegistry.get('redis');
    if (redis && !redis.simulated) {
      this.setupRedisSubscription(redis);
      // Publish event to Redis network channels
      redis.publish('sonicstream:events', JSON.stringify({ event, payload, __metadata: { eventId, timestamp } }))
        .catch((pubErr: any) => console.warn('[EventBus] Post-publish packet lost:', pubErr.message));
    }

    setTimeout(() => {
      super.emit(event, { ...payload, __metadata: { eventId, timestamp } });
    }, 10);
    return true;
  }

  /** Subscribe a named consumer group handler to an event. */
  subscribe(event: string, group: string, handler: (payload: any) => void): void {
    console.log(`[EventBus] Consumer [${group}] subscribed to ${event}`);
    this.on(event, handler);
  }
}

export const eventBus = new EventBus();
