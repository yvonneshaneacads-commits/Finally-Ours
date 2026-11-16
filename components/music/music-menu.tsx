import { useEffect, useRef, useState } from "react";
import { ChevronDown, Music2, Pause, Play, SkipForward, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MusicTrack {
  id: string;
  title: string;
}

/** The four songs that drift through the little universe. */
const INITIAL_TRACKS: MusicTrack[] = [
  { id: "4OoIXTvaxOk", title: "Make It With You" },
  { id: "n-cK70DXsSA", title: "Our song · 2" },
  { id: "XL5TCBSdwqk", title: "Our song · 3" },
  { id: "ndY9yaSwnxM", title: "Our song · 4" },
];

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

export function MusicMenu() {
  const [tracks, setTracks] = useState<MusicTrack[]>(INITIAL_TRACKS);
  const [index, setIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const indexRef = useRef(0);
  const shuffleRef = useRef(false);
  const tracksRef = useRef(tracks);
  const startingRef = useRef(false);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // Read the real titles once, so the menu isn't a list of ids.
  useEffect(() => {
    let active = true;
    (async () => {
      const resolved = await Promise.all(
        INITIAL_TRACKS.map(async (track) => {
          if (!track.title.startsWith("Our song")) return track;
          try {
            const { data } = await supabase.functions.invoke("youtube-lookup", {
              body: { action: "resolve", url: track.id },
            });
            return data?.title ? { ...track, title: String(data.title) } : track;
          } catch {
            return track;
          }
        }),
      );
      if (active) setTracks(resolved);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const goTo = (next: number, autoplay = true) => {
    const list = tracksRef.current;
    const safe = ((next % list.length) + list.length) % list.length;
    indexRef.current = safe;
    setIndex(safe);
    const player = playerRef.current;
    if (player) {
      player.loadVideoById(list[safe].id);
      if (autoplay) player.playVideo();
    }
  };

  const nextTrack = (autoplay = true) => {
    const total = tracksRef.current.length;
    if (shuffleRef.current && total > 1) {
      let next = indexRef.current;
      while (next === indexRef.current) next = Math.floor(Math.random() * total);
      goTo(next, autoplay);
      return;
    }
    goTo(indexRef.current + 1, autoplay);
  };

  const ensurePlayer = async () => {
    if (playerRef.current) return;
    await loadYouTubeApi();
    if (!window.YT || !hostRef.current) return;
    await new Promise<void>((resolve) => {
      const finish = window.setTimeout(resolve, 6000);
      const player = new window.YT!.Player(hostRef.current!, {
        videoId: tracksRef.current[indexRef.current].id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            window.clearTimeout(finish);
            player.setVolume(35);
            resolve();
          },
          onStateChange: (event) => {
            if (event.data === 1) {
              setPlaying(true);
            } else if (event.data === 2) {
              setPlaying(false);
            } else if (event.data === 0) {
              nextTrack(true);
            }
          },
        },
      });
      playerRef.current = player;
    });
  };

  const toggle = async () => {
    if (startingRef.current) return;
    if (!playerRef.current) {
      startingRef.current = true;
      await ensurePlayer();
      startingRef.current = false;
      try {
        playerRef.current?.playVideo();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
      return;
    }
    if (playing) {
      playerRef.current.pauseVideo();
      setPlaying(false);
    } else {
      playerRef.current.playVideo();
      setPlaying(true);
    }
  };

  const selectTrack = async (next: number) => {
    if (!playerRef.current) {
      indexRef.current = next;
      setIndex(next);
      startingRef.current = true;
      await ensurePlayer();
      startingRef.current = false;
      try {
        playerRef.current?.playVideo();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
      return;
    }
    goTo(next, true);
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={playing}
        title={playing ? "Pause our background music" : "Play our background music"}
        aria-label={playing ? "Pause background music" : "Play background music"}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border transition",
          playing
            ? "border-sage/40 bg-sage-soft text-sage"
            : "border-transparent text-ink-soft hover:border-border hover:bg-muted/70",
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Choose our background music"
            className="grid h-6 w-5 place-items-center rounded-full text-muted-foreground transition hover:text-ink"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[17rem] rounded-2xl border-border/80 bg-card p-2 shadow-lift">
          <DropdownMenuLabel className="hand px-2 text-[1.05rem] text-sage">
            our little soundtrack
          </DropdownMenuLabel>
          <p className="px-2 pb-1 text-[0.56rem] leading-snug text-muted-foreground">
            Plays quietly in the background, no player window.
          </p>
          <DropdownMenuSeparator className="bg-border/70" />

          <DropdownMenuItem onSelect={() => void toggle()} className="rounded-xl">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause music" : "Play music"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => nextTrack()} className="rounded-xl">
            <SkipForward className="h-3.5 w-3.5" /> Next song
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem
            checked={shuffle}
            onCheckedChange={(value) => setShuffle(Boolean(value))}
            onSelect={(event) => event.preventDefault()}
            className="rounded-xl"
          >
            <Shuffle className="mr-1 h-3.5 w-3.5" /> Shuffle the four
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator className="bg-border/70" />
          {tracks.map((track, trackIndex) => (
            <DropdownMenuItem
              key={track.id}
              onSelect={() => void selectTrack(trackIndex)}
              className={cn("rounded-xl", trackIndex === index && "bg-sage-soft/60")}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  trackIndex === index ? "bg-sage" : "bg-border",
                )}
              />
              <span className="min-w-0 flex-1 truncate">{track.title}</span>
              {trackIndex === index && playing && (
                <span className="text-[0.5rem] font-bold uppercase tracking-wide text-sage">on</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* The player lives here, clipped to a single pixel — sound only, no window. */}
      <div
        ref={hostRef}
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
      />
    </div>
  );
}
