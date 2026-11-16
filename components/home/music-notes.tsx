import { useEffect, useRef, useState } from "react";
import { Loader2, Music2, Pause, Pencil, Play, Plus, Search, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { makeId, useUniverse } from "@/store/universe";
import { supabase } from "@/integrations/supabase/client";
import type { MusicNote, PersonId } from "@/lib/types";
import { MascotAvatar } from "@/components/kit/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField, TextareaField } from "@/components/kit/controls";
import { usePrivateImageUrls } from "@/hooks/use-private-images";
import {
  audioUploadError,
  deletePrivateImage,
  uploadPrivateAudio,
} from "@/lib/keepsakes";
import { cn } from "@/lib/utils";

export function MusicNotes() {
  const { data, mutate, spaceId } = useUniverse();
  const [draft, setDraft] = useState<MusicNote | null>(null);
  const [uploading, setUploading] = useState(false);
  const [songInput, setSongInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { videoId: string; title: string; author: string; thumbnail: string }[]
  >([]);
  const [manualSearchUrl, setManualSearchUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const paths = data.musicNotes
    .map((note) => note.audioPath)
    .filter((path): path is string => Boolean(path));
  const urls = usePrivateImageUrls(paths);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const timeLabel = (seconds = 0) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  const togglePlay = async (note: MusicNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (note.youtubeId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(note.id);
      return;
    }
    if (!note.audioPath) return;
    const url = urls[note.audioPath];
    if (!url) {
      toast("Still fetching that clip…");
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    try {
      await audio.play();
      setPlayingId(note.id);
    } catch {
      toast("That clip couldn't play", { description: "Try uploading it again as an MP3." });
    }
  };

  const chooseSong = (result: { videoId: string; title: string; author: string }) => {
    setDraft((current) =>
      current
        ? { ...current, youtubeId: result.videoId, title: result.title, artist: result.author }
        : current,
    );
    setSearchResults([]);
    setSongInput("");
  };

  const findSong = async () => {
    const value = songInput.trim();
    if (!value || resolving || !draft) return;
    setResolving(true);
    const looksLikeLink = /youtu\.?be|youtube\.com|^[A-Za-z0-9_-]{11}$/i.test(value);
    try {
      if (looksLikeLink) {
        const { data, error } = await supabase.functions.invoke("youtube-lookup", {
          body: { action: "resolve", url: value },
        });
        if (error || data?.error) {
          toast("We couldn't read that song", { description: data?.error ?? error?.message });
          return;
        }
        setDraft({
          ...draft,
          youtubeId: data.videoId,
          title: data.title,
          artist: data.author,
          startSeconds: data.startSeconds || draft.startSeconds || 0,
        });
        setSearchResults([]);
        setManualSearchUrl(null);
        setSongInput("");
        toast("Song found", { description: data.title });
        return;
      }

      const { data, error } = await supabase.functions.invoke("youtube-lookup", {
        body: { action: "search", query: value },
      });
      if (error || data?.error) {
        toast("Search didn't answer", { description: data?.error ?? error?.message });
        return;
      }
      if (data.configured && data.results?.length) {
        setSearchResults(data.results);
        setManualSearchUrl(null);
        return;
      }
      const url =
        data.searchUrl ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(value)}`;
      setManualSearchUrl(url);
      window.open(url, "_blank", "noopener");
      toast("Opening YouTube search", {
        description: "Pick the song there, then paste its link back here.",
      });
    } finally {
      setResolving(false);
    }
  };

  const openEditor = (note: MusicNote | null) => {
    setDraft(
      note ?? {
        id: makeId("music-note"),
        person: "you",
        title: "",
        artist: "",
        message: "",
        createdAt: new Date().toISOString(),
      },
    );
  };

  const pickAudio = async (file?: File) => {
    if (!file || !draft) return;
    const problem = audioUploadError(file);
    if (problem) {
      toast(problem);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadPrivateAudio(spaceId, file);
      setDraft({ ...draft, audioPath: path });
    } catch (error) {
      toast("That clip didn't upload", {
        description: error instanceof Error ? error.message : "Try a shorter one?",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveNote = () => {
    if (!draft || !draft.title.trim()) {
      toast("Add the song title first");
      return;
    }
    mutate((state) => ({
      ...state,
      musicNotes: [
        ...state.musicNotes.filter((note) => note.person !== "you"),
        { ...draft, person: "you", createdAt: new Date().toISOString() },
      ],
    }));
    setDraft(null);
    toast("Your note is on the dashboard", {
      description: `${data.people.me.name} will see it with the song.`,
    });
  };

  const removeNote = async () => {
    if (!draft) return;
    if (!window.confirm("Clear your music note?")) return;
    if (draft.audioPath) await deletePrivateImage(draft.audioPath);
    mutate((state) => ({
      ...state,
      musicNotes: state.musicNotes.filter((note) => note.person !== "you"),
    }));
    setDraft(null);
    toast("Note cleared");
  };

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-label="Music notes for each other">
      {(["you", "me"] as PersonId[]).map((person) => {
        const personData = data.people[person];
        const note = data.musicNotes.find((entry) => entry.person === person);
        const mine = person === "you";
        const playing = Boolean(note && playingId === note.id);
        return (
          <div
            key={person}
            className={cn(
              "stitched relative rounded-[1.7rem] border border-border/70 bg-butter-soft/70 px-3.5 pb-3 pt-2.5 shadow-note",
              mine ? "-rotate-[0.4deg]" : "rotate-[0.5deg]",
            )}
          >
            <span className="washi absolute -top-2 left-6 h-4 w-12 -rotate-3 rounded-[2px] opacity-80" aria-hidden />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MascotAvatar name={personData.companion} className="h-7 w-7" />
                <div className="leading-tight">
                  <p className="text-[0.7rem] font-bold">{personData.name}</p>
                  <p className="text-[0.54rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {mine ? "your note to them" : "their note to you"}
                  </p>
                </div>
              </div>
              {mine && (
                <button
                  type="button"
                  onClick={() => openEditor(note ?? null)}
                  aria-label="Edit your music note"
                  title="Edit your note"
                  className="grid h-6 w-6 place-items-center rounded-full text-ink-soft transition hover:bg-card/80 hover:text-sage"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>

            <p className="hand mt-1.5 min-h-[2.2rem] text-[1.15rem] leading-tight text-ink/85">
              {note?.message ||
                (mine
                  ? `Leave ${data.people.me.name} a line and a song.`
                  : "No note yet — maybe they're still choosing.")}
            </p>

            <div className="mt-1.5 flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-2 py-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => note && void togglePlay(note)}
                disabled={!note?.youtubeId && !note?.audioPath}
                aria-label={playing ? "Pause the song" : "Play the song"}
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full transition",
                  note?.youtubeId || note?.audioPath
                    ? "bg-sage text-primary-foreground hover:bg-sage/90"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.68rem] font-bold leading-tight">
                  {note?.title || "No song yet"}
                </p>
                <p className="truncate text-[0.55rem] leading-tight text-muted-foreground">
                  {note?.artist || (mine ? "Find it on YouTube or attach a clip" : "Nothing playing")}
                  {note?.youtubeId && note.startSeconds ? ` · from ${timeLabel(note.startSeconds)}` : ""}
                </p>
              </div>
              <span className="flex items-end gap-[3px]" aria-hidden>
                {[0, 1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className={cn(
                      "w-[3px] rounded-full bg-sage/70 transition-opacity",
                      playing ? "animate-pulse" : "opacity-40",
                    )}
                    style={{ height: `${5 + bar * 3}px`, animationDelay: `${bar * 0.14}s` }}
                  />
                ))}
              </span>
              <Music2 className="h-3 w-3 text-muted-foreground" aria-hidden />
            </div>

            {playing && note?.youtubeId && (
              <div className="mt-1.5 overflow-hidden rounded-xl border border-border/70 bg-black/10">
                <iframe
                  key={`${note.id}-${note.startSeconds ?? 0}`}
                  src={`https://www.youtube-nocookie.com/embed/${note.youtubeId}?start=${
                    note.startSeconds ?? 0
                  }&autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title={note.title || "Our song"}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="aspect-video w-full border-0"
                />
              </div>
            )}

            {mine && (
              <button
                type="button"
                onClick={() => openEditor(note ?? null)}
                className="mt-1.5 inline-flex items-center gap-1 text-[0.6rem] font-bold text-sage hover:underline"
              >
                {note ? <Pencil className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                {note ? "Change your note" : "Note a song"}
              </button>
            )}
          </div>
        );
      })}

      <Dialog
        open={Boolean(draft)}
        onOpenChange={(open) => {
          if (!open) {
            setDraft(null);
            setSearchResults([]);
            setManualSearchUrl(null);
            setSongInput("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="hand text-[1.5rem]">
              A song for {data.people.me.name}
            </DialogTitle>
            <DialogDescription className="text-[0.75rem]">
              Pick something that says what you can&apos;t. Add a short clip if you have one.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-2.5">
              <div className="space-y-2 rounded-2xl border border-dashed border-border/80 bg-muted/25 p-2.5">
                <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <Youtube className="h-3.5 w-3.5 text-sage" aria-hidden /> Song from YouTube
                </p>
                <div className="flex gap-1.5">
                  <input
                    value={songInput}
                    onChange={(event) => setSongInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void findSong();
                      }
                    }}
                    placeholder="Paste a YouTube link, or type a song to search"
                    className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-card px-2.5 text-[0.74rem] outline-none focus-visible:border-sage/60"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 bg-card text-[0.64rem]"
                    onClick={() => void findSong()}
                    disabled={resolving || !songInput.trim()}
                  >
                    {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                    Find
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <ul className="max-h-44 space-y-1 overflow-y-auto">
                    {searchResults.map((result) => (
                      <li key={result.videoId}>
                        <button
                          type="button"
                          onClick={() => chooseSong(result)}
                          className="flex w-full items-center gap-2 rounded-xl bg-card/80 p-1.5 text-left transition hover:bg-card"
                        >
                          <img
                            src={result.thumbnail}
                            alt=""
                            className="h-9 w-16 shrink-0 rounded-md object-cover"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[0.68rem] font-bold">{result.title}</span>
                            <span className="block truncate text-[0.55rem] text-muted-foreground">
                              {result.author}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {draft.youtubeId && (
                  <div className="flex items-center gap-2 rounded-xl bg-card/85 p-1.5">
                    <img
                      src={`https://i.ytimg.com/vi/${draft.youtubeId}/hqdefault.jpg`}
                      alt=""
                      className="h-10 w-16 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.68rem] font-bold">{draft.title || "YouTube song"}</p>
                      <p className="truncate text-[0.55rem] text-muted-foreground">
                        {draft.artist || "YouTube"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, youtubeId: undefined })}
                      className="shrink-0 text-[0.55rem] font-bold text-muted-foreground transition hover:text-destructive"
                    >
                      remove
                    </button>
                  </div>
                )}

                {manualSearchUrl && (
                  <a
                    href={manualSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-sage underline"
                  >
                    Open YouTube search
                  </a>
                )}
                <p className="text-[0.55rem] leading-snug text-muted-foreground">
                  Typing a song opens YouTube search; paste the link back and we&apos;ll read its title and channel.
                </p>
              </div>

              <TextField
                label="Song"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Make It With You"
              />
              <TextField
                label="Artist"
                value={draft.artist}
                onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
                placeholder="Who sings it"
              />
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/25 p-2.5">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Where it starts
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <TextField
                    label="Minutes"
                    type="number"
                    min={0}
                    value={Math.floor((draft.startSeconds ?? 0) / 60)}
                    onChange={(event) => {
                      const minutes = Math.max(0, Number(event.target.value) || 0);
                      setDraft({
                        ...draft,
                        startSeconds: minutes * 60 + ((draft.startSeconds ?? 0) % 60),
                      });
                    }}
                  />
                  <TextField
                    label="Seconds"
                    type="number"
                    min={0}
                    max={59}
                    value={(draft.startSeconds ?? 0) % 60}
                    onChange={(event) => {
                      const seconds = Math.min(59, Math.max(0, Number(event.target.value) || 0));
                      setDraft({
                        ...draft,
                        startSeconds: Math.floor((draft.startSeconds ?? 0) / 60) * 60 + seconds,
                      });
                    }}
                  />
                </div>
                <p className="mt-1 text-[0.55rem] text-muted-foreground">
                  The card shows this time and the player begins there.
                  {(draft.startSeconds ?? 0) > 0 ? ` Currently ${timeLabel(draft.startSeconds)}.` : ""}
                </p>
              </div>

              <TextareaField
                label="Your line to them"
                value={draft.message}
                onChange={(event) => setDraft({ ...draft, message: event.target.value.slice(0, 140) })}
                placeholder="it keeps no record of wrongs"
                hint={`${draft.message.length}/140`}
              />

              <input
                ref={fileRef}
                type="file"
                accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/webm"
                className="sr-only"
                onChange={(event) => void pickAudio(event.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-card text-[0.62rem]"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Music2 className="h-3 w-3" />}
                  {draft.audioPath ? "Replace clip" : "Attach a clip"}
                </Button>
                {draft.audioPath && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[0.6rem]"
                    onClick={() => setDraft({ ...draft, audioPath: undefined })}
                  >
                    Remove clip
                  </Button>
                )}
                <p className="w-full text-[0.55rem] text-muted-foreground">
                  MP3, M4A, WAV, OGG or WEBM · up to 10 MB · private to the two of you.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {data.musicNotes.some((note) => note.person === "you") && (
              <Button variant="ghost" size="sm" onClick={() => void removeNote()}>
                <Trash2 className="h-3.5 w-3.5" /> Clear note
              </Button>
            )}
            <Button variant="soft" size="sm" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveNote}>
              Put it on the dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
