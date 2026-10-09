/**
 * Google Calendar integration — 2026-10-08 Firebase removal phase 2.
 *
 * The old implementation obtained a Google OAuth token through Firebase Auth's
 * signInWithPopup, which rode on the suspended GCP project — so "Connect
 * Google Calendar" has been silently broken in production. Until the platform
 * has its own Google OAuth client, this module keeps the exact same export
 * surface but reports "not connected" and raises a clear, user-facing message
 * on connect attempts, instead of a dead popup.
 */

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
}

const UPGRADE_MESSAGE =
  'Google Calendar sync is being upgraded — bookings and events still work, and calendar sync will return soon.';

export const connectGoogleCalendar = async (): Promise<{ accessToken: string; email: string | null } | null> => {
  throw new Error(UPGRADE_MESSAGE);
};

export const disconnectGoogleCalendar = () => {
  /* nothing cached */
};

export const isGoogleCalendarConnected = (): boolean => false;

export const getConnectedEmail = (): string | null => null;

export const fetchUpcomingEvents = async (_maxResults = 10): Promise<GoogleCalendarEvent[]> => {
  return [];
};

export const addEventToCalendar = async (_event: GoogleCalendarEvent): Promise<GoogleCalendarEvent | null> => {
  throw new Error(UPGRADE_MESSAGE);
};
