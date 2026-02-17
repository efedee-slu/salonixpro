# Google Calendar Sync — Setup Guide

## Prerequisites

- A Google Cloud Platform (GCP) account
- Admin access to SalonixPro settings

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **New Project**
3. Name it something like `SalonixPro Calendar`
4. Click **Create**

## Step 2: Enable the Google Calendar API

1. In your new project, go to **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Click on it, then click **Enable**

## Step 3: Configure the OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type → **Create**
3. Fill in:
   - **App name**: `SalonixPro`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue**
5. On the **Scopes** screen, click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/calendar.events`
6. Click **Save and Continue**
7. On **Test users**, add the Google accounts of your stylists
8. Click **Save and Continue** → **Back to Dashboard**

> **Note**: While in "Testing" mode, only added test users can connect. To allow any Google account, submit the app for verification.

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name: `SalonixPro Web`
5. Under **Authorized redirect URIs**, add:
   - For local development: `http://localhost:3000/api/integrations/google/callback`
   - For production: `https://yourdomain.com/api/integrations/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"
```

For production, update `GOOGLE_REDIRECT_URI` to your production URL.

## Step 6: Enable in SalonixPro

1. Log in as an Owner or Manager
2. Go to **Settings** → **Integrations** tab
3. Toggle **Enable Google Calendar sync** on
4. Configure your preferences (auto-sync, include phone, include notes)
5. Click **Save**

## Step 7: Connect Stylists

1. Go to **Stylists** page
2. Click **Edit** on a stylist
3. In the Google Calendar section, click **Connect Google Calendar**
4. The stylist will be redirected to Google to authorize access
5. After authorization, they'll be redirected back with a success message

## Usage

- **Auto-sync**: New appointments are automatically added to the stylist's Google Calendar
- **Updates**: When an appointment is updated, the calendar event is updated too
- **Cancellations**: Cancelled appointments are removed from Google Calendar
- **Sync Now**: Use the "Sync Now" button to manually sync all future appointments
- **Disconnect**: Use the "Disconnect" button to revoke access and stop syncing

## Troubleshooting

### "Calendar Connection Failed"
- Check that the Google Cloud project has the Calendar API enabled
- Verify the redirect URI matches exactly in both GCP and `.env`
- Make sure the user's Google account is added as a test user (if in testing mode)

### Events not appearing
- Check that Google Calendar sync is enabled in Settings → Integrations
- Verify the stylist has "Connected" status in the Edit dialog
- Check that "Auto-sync new appointments" is enabled
- Try the "Sync Now" button to manually sync

### Token refresh errors
- If a stylist's connection stops working, disconnect and reconnect their account
- The system automatically disables sync if token refresh fails

## Production Deployment

When deploying to production:

1. Update `GOOGLE_REDIRECT_URI` to your production URL
2. Add the production redirect URI in GCP Credentials
3. Consider submitting the OAuth app for Google verification to remove the "unverified app" warning
4. The retry cron job runs every 6 hours to catch any failed syncs
