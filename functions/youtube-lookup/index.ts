const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (url.hostname.endsWith("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0]?.slice(0, 11) ?? null;
    }
    if (url.pathname === "/watch") return url.searchParams.get("v");
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] ?? null;
    if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] ?? null;
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

function startFromUrl(input: string): number | null {
  const match = input.match(/[?&#](?:t|start)=([0-9hms]+)/i);
  if (!match) return null;
  return secondsFromText(match[1]);
}

function secondsFromText(value: string): number | null {
  if (/^\d+$/.test(value)) return Number(value);
  const parts = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!parts) return null;
  const [, h, m, s] = parts;
  if (!h && !m && !s) return null;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "resolve");

    if (action === "search") {
      const query = String(body.query ?? "").trim();
      if (!query) return json({ error: "Type a song to search for" }, 400);
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const key = Deno.env.get("YOUTUBE_API_KEY");
      if (!key) {
        return json({ configured: false, results: [], searchUrl });
      }
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&videoEmbeddable=true&q=${encodeURIComponent(query)}&key=${key}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return json(
          {
            configured: true,
            results: [],
            error: payload?.error?.message ?? "YouTube search did not answer",
            searchUrl,
          },
          200,
        );
      }
      const results = (payload?.items ?? []).map((item: Record<string, unknown>) => {
        const snippet = (item.snippet ?? {}) as Record<string, unknown>;
        const thumbs = (snippet.thumbnails ?? {}) as Record<string, { url?: string }>;
        return {
          videoId: (item.id as Record<string, string>)?.videoId ?? "",
          title: String(snippet.title ?? "YouTube song"),
          author: String(snippet.channelTitle ?? ""),
          thumbnail: thumbs.medium?.url ?? thumbs.default?.url ?? "",
        };
      });
      return json({ configured: true, results, searchUrl });
    }

    const input = String(body.url ?? body.videoId ?? "");
    const videoId = parseVideoId(input);
    if (!videoId) {
      return json({ error: "That doesn't look like a YouTube link" }, 400);
    }

    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
    );
    const meta = response.ok ? await response.json().catch(() => null) : null;

    return json({
      videoId,
      title: String(meta?.title ?? "YouTube song"),
      author: String(meta?.author_name ?? ""),
      thumbnail: String(meta?.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
      startSeconds: startFromUrl(input) ?? 0,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not read that song" }, 502);
  }
});
