import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// In-memory caching for the Google Calendar access token and state
let cachedAccessToken: string | null = null;
let connectedEmail: string | null = null;
let isConnecting = false;

// Clear the cached token on logout
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    connectedEmail = null;
  }
});

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

/**
 * Initiates the Google sign-in popup to grant Google Calendar permissions
 * and caches the resulting access token in memory.
 */
export const connectGoogleCalendar = async (): Promise<{ accessToken: string; email: string | null } | null> => {
  if (isConnecting) return null;
  isConnecting = true;
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    // Explicitly prompt for authorization so they can confirm scopes
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token.');
    }

    cachedAccessToken = credential.accessToken;
    connectedEmail = result.user.email;
    return { accessToken: cachedAccessToken, email: connectedEmail };
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    throw error;
  } finally {
    isConnecting = false;
  }
};

/**
 * Disconnects Google Calendar from the in-memory cache
 */
export const disconnectGoogleCalendar = () => {
  cachedAccessToken = null;
  connectedEmail = null;
};

/**
 * Checks if the Google Calendar integration is connected and active
 */
export const isGoogleCalendarConnected = (): boolean => {
  return !!cachedAccessToken;
};

/**
 * Gets the connected email
 */
export const getConnectedEmail = (): string | null => {
  return connectedEmail;
};

/**
 * Fetches upcoming events from the user's primary calendar
 */
export const fetchUpcomingEvents = async (maxResults = 10): Promise<GoogleCalendarEvent[]> => {
  if (!cachedAccessToken) {
    throw new Error('Google Calendar is not connected. Please connect your account first.');
  }

  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&maxResults=${maxResults}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch calendar events: ${errText || response.statusText}`);
  }

  const data = await response.json();
  return (data.items || []) as GoogleCalendarEvent[];
};

/**
 * Adds an event to the primary Google Calendar
 */
export const addEventToCalendar = async (
  summary: string,
  description: string,
  location: string,
  startTime: string,
  endTime: string
): Promise<GoogleCalendarEvent> => {
  if (!cachedAccessToken) {
    throw new Error('Google Calendar is not connected. Please connect your account first.');
  }

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

  const body: GoogleCalendarEvent = {
    summary,
    description,
    location,
    start: {
      dateTime: new Date(startTime).toISOString(),
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to add event to Google Calendar: ${errText || response.statusText}`);
  }

  return (await response.json()) as GoogleCalendarEvent;
};
