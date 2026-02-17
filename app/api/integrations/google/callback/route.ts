// app/api/integrations/google/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleCallback } from "@/lib/google-calendar";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL("/stylists?calendarError=denied", request.url)
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL("/stylists?calendarError=missing_params", request.url)
      );
    }

    // Parse state
    let state: { stylistId: string; csrf: string };
    try {
      state = JSON.parse(stateParam);
    } catch {
      return NextResponse.redirect(
        new URL("/stylists?calendarError=invalid_state", request.url)
      );
    }

    // Verify CSRF token
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get("google_oauth_csrf");

    if (!csrfCookie || csrfCookie.value !== state.csrf) {
      return NextResponse.redirect(
        new URL("/stylists?calendarError=csrf_mismatch", request.url)
      );
    }

    // Exchange code for tokens
    await handleCallback(code, state.stylistId);

    // Clear CSRF cookie and redirect
    const response = NextResponse.redirect(
      new URL("/stylists?calendarConnected=true", request.url)
    );
    response.cookies.delete("google_oauth_csrf");

    return response;
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/stylists?calendarError=callback_failed", request.url)
    );
  }
}
