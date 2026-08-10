type EventType = 'click' | 'conversion' | 'scroll_depth' | 'page_view' | 'auth_action';

interface AnalyticsEvent {
  type: EventType;
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  public track(type: EventType, name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type,
      name,
      properties,
      timestamp: Date.now(),
    };
    
    this.events.push(event);
    
    // In a real app, we would send this to a backend or a service like Segment/Mixpanel
    console.log(`[Analytics] ${type.toUpperCase()}: ${name}`, properties);

    // Save to localStorage for persistence in this demo
    const savedEvents = JSON.parse(localStorage.getItem('v12_analytics') || '[]');
    savedEvents.push(event);
    localStorage.setItem('v12_analytics', JSON.stringify(savedEvents.slice(-100))); // Keep last 100
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }
}

export const analytics = Analytics.getInstance();
