import { Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useUniverse } from "@/store/universe";
import { CompanionGroup } from "@/components/kit/bits";
import { StickyNote, TinyStar } from "@/components/kit/panel";
import { cn } from "@/lib/utils";

export function WelcomePanel({ className }: { className?: string }) {
  const { data } = useUniverse();
  const { you, me } = data.people;
  const since = new Date(data.settings.anniversary || "not-set");
  const hasAnniversary = Boolean(data.settings.anniversary) && !Number.isNaN(since.getTime());
  const days = hasAnniversary ? Math.max(1, Math.round((Date.now() - since.getTime()) / 86400000)) : 0;
  const verse = data.settings.verse.replace(/^“|”$/g, "").trim();

  return (
    <section
      className={cn(
        "grain stitched relative flex min-h-[200px] flex-col overflow-hidden rounded-[1.9rem] border border-border/80 bg-card shadow-card sm:min-h-[236px]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[52%] sm:w-[48%]">
        <CompanionGroup className="h-full w-full object-cover object-[60%_center] opacity-95 dark:brightness-[0.82]" />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/85 to-transparent" />
      </div>

      <div className="relative z-10 flex max-w-[64%] flex-col gap-2 p-5 sm:max-w-[58%] sm:gap-2.5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="label-caps">Welcome back</span>
          <Sparkles className="h-3 w-3 text-sage" aria-hidden />
        </div>
        <h1 className="hand flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[1.95rem] leading-[1.05] text-ink sm:text-[2.4rem]">
          <span>{you.name}</span>
          <Heart
            className="h-[0.55em] w-[0.55em] shrink-0 animate-heart-beat fill-coral/40 text-coral"
            aria-hidden
          />
          <span>{me.name}</span>
        </h1>
        <p className="hand text-[1.05rem] leading-tight text-ink-soft sm:text-[1.15rem]">
          {data.settings.siteNote}
        </p>

        <div className="mt-1 max-w-[22rem] border-l-2 border-sage/40 pl-3">
          {verse ? (
            <p className="font-read text-[0.76rem] italic leading-snug text-ink-soft">“{verse}”</p>
          ) : (
            <Link to="/settings" className="block font-read text-[0.72rem] leading-snug text-muted-foreground hover:text-sage">
              Add the verse or words you want to wake up to — Settings → Our shared words.
            </Link>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.64rem] font-semibold text-muted-foreground">
          {hasAnniversary ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-1 text-sage">
              <Heart className="h-2.5 w-2.5" aria-hidden /> {days} days of us
            </span>
          ) : (
            <Link to="/memories" className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-1 text-sage hover:bg-sage/15">
              <Heart className="h-2.5 w-2.5" aria-hidden /> Set the day we began
            </Link>
          )}
          <span className="hidden items-center gap-1 sm:inline-flex">
            <TinyStar className="text-[hsl(42_70%_60%)]" /> our little corner of the internet
          </span>
        </div>
      </div>

      <StickyNote
        tone="butter"
        className="absolute bottom-3 right-3 z-10 hidden w-[7.6rem] rotate-2 md:block"
      >
        same sky, different cities
      </StickyNote>

      <span aria-hidden className="pointer-events-none absolute right-4 top-3 text-[hsl(342_60%_72%)]">
        <Heart className="h-3.5 w-3.5 animate-heart-beat" />
      </span>
      <span aria-hidden className="pointer-events-none absolute right-14 top-8 text-[hsl(42_75%_65%)]">
        <Sparkles className="h-3 w-3 animate-twinkle" />
      </span>
    </section>
  );
}
