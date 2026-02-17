// lib/google-calendar.ts
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// ============================================
// OAuth Functions
// ============================================

export function getAuthUrl(stylistId: string, csrfToken: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: JSON.stringify({ stylistId, csrf: csrfToken }),
  });
}

export async function handleCallback(code: string, stylistId: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  await prisma.stylist.update({
    where: { id: stylistId },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
      googleCalendarSync: true,
    },
  });

  return tokens;
}

export async function getAuthenticatedClient(stylistId: string) {
  const stylist = await prisma.stylist.findUnique({
    where: { id: stylistId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!stylist?.googleAccessToken) {
    return null;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: stylist.googleAccessToken,
    refresh_token: stylist.googleRefreshToken,
    expiry_date: stylist.googleTokenExpiresAt?.getTime(),
  });

  // Auto-refresh if token is expired or about to expire (within 5 min)
  const now = Date.now();
  const expiresAt = stylist.googleTokenExpiresAt?.getTime() || 0;
  if (expiresAt - now < 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.stylist.update({
        where: { id: stylistId },
        data: {
          googleAccessToken: credentials.access_token,
          googleRefreshToken:
            credentials.refresh_token || stylist.googleRefreshToken,
          googleTokenExpiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : null,
        },
      });
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error(
        `Failed to refresh Google token for stylist ${stylistId}:`,
        error
      );
      // Disable sync on auth failure
      await prisma.stylist.update({
        where: { id: stylistId },
        data: { googleCalendarSync: false },
      });
      return null;
    }
  }

  return oauth2Client;
}

export async function revokeAccess(stylistId: string) {
  const stylist = await prisma.stylist.findUnique({
    where: { id: stylistId },
    select: { googleAccessToken: true },
  });

  if (stylist?.googleAccessToken) {
    try {
      const oauth2Client = getOAuth2Client();
      await oauth2Client.revokeToken(stylist.googleAccessToken);
    } catch (error) {
      // Token may already be revoked, continue cleanup
      console.error("Error revoking Google token:", error);
    }
  }

  await prisma.stylist.update({
    where: { id: stylistId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiresAt: null,
      googleCalendarSync: false,
    },
  });

  // Mark all CalendarSync records as DELETED
  await prisma.calendarSync.updateMany({
    where: { stylistId },
    data: { syncStatus: "DELETED" },
  });
}

// ============================================
// Calendar Event Functions (with retry)
// ============================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.response?.status || error?.code;
      // Don't retry on auth errors
      if (status === 401 || status === 403) {
        throw error;
      }
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  return null;
}

interface EventParams {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export async function createEvent(
  stylistId: string,
  calendarId: string,
  params: EventParams
): Promise<string | null> {
  const auth = await getAuthenticatedClient(stylistId);
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });

  const result = await withRetry(async () => {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: params.title,
        description: params.description,
        start: {
          dateTime: params.startTime.toISOString(),
        },
        end: {
          dateTime: params.endTime.toISOString(),
        },
        location: params.location,
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 30 }],
        },
        colorId: "7", // teal
      },
    });
    return response.data.id || null;
  });

  return result;
}

export async function updateEvent(
  stylistId: string,
  calendarId: string,
  eventId: string,
  params: EventParams
): Promise<boolean> {
  const auth = await getAuthenticatedClient(stylistId);
  if (!auth) return false;

  const calendar = google.calendar({ version: "v3", auth });

  const result = await withRetry(async () => {
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: params.title,
        description: params.description,
        start: {
          dateTime: params.startTime.toISOString(),
        },
        end: {
          dateTime: params.endTime.toISOString(),
        },
        location: params.location,
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 30 }],
        },
        colorId: "7",
      },
    });
    return true;
  });

  return result ?? false;
}

export async function deleteEvent(
  stylistId: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  const auth = await getAuthenticatedClient(stylistId);
  if (!auth) return false;

  const calendar = google.calendar({ version: "v3", auth });

  const result = await withRetry(async () => {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return true;
  });

  return result ?? false;
}
