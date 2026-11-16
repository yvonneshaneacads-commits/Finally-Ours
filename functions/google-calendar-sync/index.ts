// Google Calendar sync using your own Google OAuth app (no third-party gateway).
//
// Secrets required (supabase secrets set ...):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   OAuth "Web application" credentials
//   OAUTH_STATE_SECRET                       any long random string
//   APP_URL                                  your site, e.g. https://our-universe.netlify.app
//                                            (comma-separate to also allow http://localhost:8080)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided automatically.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface GoogleEventInput {
  summary?: string;
  description?: string;
  startISO?: string;
  endISO?: string;
  timezone?: string;
  location?: string;
}

interface NormalisedEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  location: string | null;
  transparency: string;
}

class NotConnectedError extends Error {}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const env = (name: string) => Deno.env.get(name) ?? "";
const functionUrl = () => `${env("SUPABASE_URL")}/functions/v1/google-calendar-sync`;
const allowedAppUrls = () =>
  env("APP_URL")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

function admin() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

// ---------- signed OAuth state ----------
const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmacKey() {
  const secret = env("OAUTH_STATE_SECRET");
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not set on the function");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function signState(payload: Record<string, unknown>) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

async function readState(state: string) {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig), enc.encode(body));
  if (!ok) return null;
  const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload as { s: string; u: string; r: string; exp: number };
}

// ---------- Google tokens ----------
const accessCache = new Map<string, { token: string; expires: number }>();

async function accessTokenFor(spaceId: string): Promise<string> {
  const cached = accessCache.get(spaceId);
  if (cached && cached.expires > Date.now() + 30_000) return cached.token;

  const { data } = await admin()
    .from("google_connections")
    .select("refresh_token")
    .eq("space_id", spaceId)
    .maybeSingle();
  if (!data?.refresh_token) throw new NotConnectedError("Google Calendar is not connected yet");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.access_token) {
    if (payload?.error === "invalid_grant") {
      await admin().from("google_connections").delete().eq("space_id", spaceId);
      accessCache.delete(spaceId);
      throw new NotConnectedError("Google access was revoked. Please connect again.");
    }
    throw new Error(payload?.error_description ?? "Google would not refresh the sign-in");
  }
  accessCache.set(spaceId, {
    token: payload.access_token,
    expires: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  });
  return payload.access_token;
}

async function google(spaceId: string, url: string, init: RequestInit = {}) {
  const token = await accessTokenFor(spaceId);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 204) return { status: 204, payload: null };
  const payload = await res.json().catch(() => null);
  if (!res.ok && !(init.method === "DELETE" && (res.status === 404 || res.status === 410))) {
    throw new Error(
      (payload as { error?: { message?: string } } | null)?.error?.message ??
        `Google Calendar returned ${res.status}`,
    );
  }
  return { status: res.status, payload };
}

// ---------- helpers ----------
function normaliseEvent(raw: Record<string, unknown>): NormalisedEvent {
  const start = raw.start as { dateTime?: string; date?: string } | undefined;
  const end = raw.end as { dateTime?: string; date?: string } | undefined;
  return {
    id: String(raw.id ?? ""),
    title: String(raw.summary ?? "Google Calendar event").slice(0, 200),
    start: start?.dateTime ?? start?.date ?? null,
    end: end?.dateTime ?? end?.date ?? null,
    allDay: Boolean(start?.date && !start?.dateTime),
    location: typeof raw.location === "string" ? raw.location.slice(0, 200) : null,
    transparency: String(raw.transparency ?? "opaque"),
  };
}

function cleanEvent(input: GoogleEventInput) {
  const summary = String(input.summary ?? "").trim().slice(0, 200);
  const description = String(input.description ?? "").slice(0, 1800);
  const startISO = String(input.startISO ?? "");
  const endISO = String(input.endISO ?? "");
  const timezone = String(input.timezone ?? "UTC");
  const location = String(input.location ?? "").slice(0, 200);

  if (!summary) throw new Error("An event needs a title before it can go to Google");
  if (!startISO || !endISO) throw new Error("An event needs a start and an end");
  if (Number.isNaN(new Date(startISO).getTime()) || Number.isNaN(new Date(endISO).getTime())) {
    throw new Error("Those event times could not be read");
  }
  if (new Date(endISO) <= new Date(startISO)) {
    throw new Error("The end time needs to be after the start");
  }
  return { summary, description, startISO, endISO, timezone, location };
}

function eventBody(e: ReturnType<typeof cleanEvent>) {
  return {
    summary: e.summary,
    description: e.description || undefined,
    location: e.location || undefined,
    start: { dateTime: e.startISO, timeZone: e.timezone },
    end: { dateTime: e.endISO, timeZone: e.timezone },
    transparency: "opaque",
  };
}

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}

// ---------- OAuth callback (browser GET from Google) ----------
async function handleCallback(url: URL) {
  const fallback = allowedAppUrls()[0] ?? "/";
  const state = await readState(url.searchParams.get("state") ?? "").catch(() => null);
  if (!state) return redirect(`${fallback}/planner?google=error`);
  const back = (flag: string) => `${state.r}?google=${flag}`;

  if (url.searchParams.get("error")) return redirect(back("denied"));
  const code = url.searchParams.get("code");
  if (!code) return redirect(back("error"));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: functionUrl(),
      grant_type: "authorization_code",
    }),
  });
  const tokens = await res.json().catch(() => null);
  if (!res.ok || !tokens?.refresh_token) {
    console.error("oauth exchange failed:", tokens?.error ?? res.status);
    return redirect(back("error"));
  }

  // Make sure the person who started this is still a member of the space.
  const { data: member } = await admin()
    .from("universe_members")
    .select("space_id")
    .eq("space_id", state.s)
    .eq("user_id", state.u)
    .maybeSingle();
  if (!member) return redirect(back("error"));

  const { error } = await admin().from("google_connections").upsert({
    space_id: state.s,
    refresh_token: tokens.refresh_token,
    connected_by: state.u,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("saving connection failed:", error.message);
    return redirect(back("error"));
  }
  accessCache.delete(state.s);
  return redirect(back("connected"));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    if (req.method === "GET") return await handleCallback(url);

    // ----- everything below needs a signed-in member of the space -----
    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization) return json({ error: "Please sign in first" }, 401);

    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Please sign in first" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "status");
    const spaceId = String(body.spaceId ?? "");
    if (!spaceId) return json({ error: "Missing universe" }, 400);

    const { data: member } = await supabase
      .from("universe_members")
      .select("space_id")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return json({ error: "This universe is not yours" }, 403);

    try {
      if (action === "status") {
        try {
          await accessTokenFor(spaceId);
        } catch (e) {
          if (!(e instanceof NotConnectedError)) throw e;
          const apps = allowedAppUrls();
          const origin = String(body.returnTo ?? "").replace(/\/+$/, "");
          const returnTo = apps.find((a) => origin === a || origin.startsWith(`${a}/`)) ? origin : `${apps[0] ?? ""}/planner`;
          const state = await signState({ s: spaceId, u: user.id, r: returnTo, exp: Date.now() + 10 * 60_000 });
          const authUrl =
            "https://accounts.google.com/o/oauth2/v2/auth?" +
            new URLSearchParams({
              client_id: env("GOOGLE_CLIENT_ID"),
              redirect_uri: functionUrl(),
              response_type: "code",
              scope: SCOPE,
              access_type: "offline",
              prompt: "consent",
              include_granted_scopes: "true",
              state,
            });
          return json({ ok: true, connected: false, authUrl });
        }
        return json({ ok: true, connected: true });
      }

      if (action === "disconnect") {
        await admin().from("google_connections").delete().eq("space_id", spaceId);
        accessCache.delete(spaceId);
        return json({ ok: true });
      }

      if (action === "pull") {
        const timeMin = String(body.timeMin ?? "");
        const timeMax = String(body.timeMax ?? "");
        if (!timeMin || !timeMax) return json({ error: "Missing the week window" }, 400);
        const q = new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "200",
          fields: "items(id,status,summary,start,end,location,transparency),timeZone",
        });
        const { payload } = await google(spaceId, `${CAL}?${q}`);
        const record = (payload ?? {}) as { items?: Record<string, unknown>[]; timeZone?: string };
        const items = (record.items ?? [])
          .filter((raw) => raw.status !== "cancelled")
          .map(normaliseEvent)
          .filter((event) => event.id && event.start);
        return json({ ok: true, items, count: items.length, timezone: record.timeZone ?? null });
      }

      if (action === "create") {
        const event = cleanEvent((body.event ?? {}) as GoogleEventInput);
        const { payload } = await google(spaceId, `${CAL}?sendUpdates=none`, {
          method: "POST",
          body: JSON.stringify(eventBody(event)),
        });
        const id = (payload as { id?: string } | null)?.id;
        if (!id) return json({ error: "Google accepted the event but returned no id" }, 502);
        return json({ ok: true, googleEventId: id });
      }

      if (action === "patch") {
        const googleEventId = String(body.googleEventId ?? "");
        if (!googleEventId) return json({ error: "Missing the Google event id" }, 400);
        const event = cleanEvent((body.event ?? {}) as GoogleEventInput);
        await google(spaceId, `${CAL}/${encodeURIComponent(googleEventId)}?sendUpdates=none`, {
          method: "PATCH",
          body: JSON.stringify(eventBody(event)),
        });
        return json({ ok: true });
      }

      if (action === "remove") {
        const googleEventId = String(body.googleEventId ?? "");
        if (!googleEventId) return json({ error: "Missing the Google event id" }, 400);
        await google(spaceId, `${CAL}/${encodeURIComponent(googleEventId)}?sendUpdates=none`, {
          method: "DELETE",
        });
        return json({ ok: true });
      }

      return json({ error: "Unknown action" }, 400);
    } catch (e) {
      if (e instanceof NotConnectedError) return json({ error: e.message, notConnected: true }, 409);
      throw e;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Calendar did not answer";
    console.error("calendar sync failed:", message);
    return json({ error: message }, 502);
  }
});
