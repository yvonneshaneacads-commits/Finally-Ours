import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Heart, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { makeId, useUniverse } from "@/store/universe";
import {
  DAY_LABELS,
  formatClock,
  formatDuration,
  hhmmInZone,
  weekdayIndexInZone,
  weekDates,
} from "@/lib/time";
import { eventInterval, overlapWindows } from "@/lib/planner";
import { Panel } from "@/components/kit/panel";
import { MascotAvatar } from "@/components/kit/bits";
import { cn } from "@/lib/utils";
import type { PersonId } from "@/lib/types";

const LANE_STYLES: Record<PersonId, { lane: string; card: string; heading: string }> = {
  you: {
    lane: "bg-butter-soft/60 border-butter",
    card: "bg-card border-border/70",
    heading: "bg-butter text-ink",
  },
  me: {
    lane: "bg-lilac/60 border-lilac",
    card: "bg-card border-border/70",
    heading: "bg-powder text-ink",
  },
};

export function PlannerPreview({ className }: { className?: string }) {
  const { data, mutate } = useUniverse();
  const dates = weekDates();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [day, setDay] = useState(todayIndex);
  const [displayPerson, setDisplayPerson] = useState<PersonId>("you");
  const zone = data.people[displayPerson].timezone;

  const overlaps = overlapWindows(data.people, day, dates, data.events, 30).sort(
    (a, b) => b.minutes - a.minutes,
  );
  const best = overlaps[0];

  const createCall = () => {
    if (!best) {
      toast("No shared window on this day yet", {
        description: "Adjust one of your open hours or move a busy event, then try again.",
      });
      return;
    }
    const stamp = makeId("call");
    mutate((draft) => ({
      ...draft,
      events: [
        ...draft.events,
        {
          id: `${stamp}-you`,
          person: "you",
          title: "Call / Date",
          day: weekdayIndexInZone(best.start, draft.people.you.timezone),
          start: hhmmInZone(best.start, draft.people.you.timezone),
          end: hhmmInZone(best.end, draft.people.you.timezone),
          status: "busy",
          category: "Us",
          recurrence: "none",
        },
        {
          id: `${stamp}-me`,
          person: "me",
          title: "Call / Date",
          day: weekdayIndexInZone(best.start, draft.people.me.timezone),
          start: hhmmInZone(best.start, draft.people.me.timezone),
          end: hhmmInZone(best.end, draft.people.me.timezone),
          status: "busy",
          category: "Us",
          recurrence: "none",
        },
      ],
    }));
    toast("Our time is saved", {
      description: "A call was added to both planners in each of your local times.",
    });
  };

  return (
    <Panel
      title="Weekly Planner"
      icon={<CalendarDays className="h-3.5 w-3.5 text-sage" aria-hidden />}
      action={
        <Link to="/planner" className="inline-flex items-center gap-0.5 hover:text-sage">
          View full planner <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      }
      className={className}
      bodyClassName="p-3 space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setDay((d) => (d + 6) % 7)}
            className="grid h-6 w-6 place-items-center rounded-full border border-border/70 bg-card text-ink-soft hover:bg-muted"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="min-w-[4.6rem] text-center text-[0.86rem] font-bold">
            {DAY_LABELS[day]}{" "}
            <span className="text-muted-foreground">{dates[day].getDate()}</span>
          </span>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setDay((d) => (d + 1) % 7)}
            className="grid h-6 w-6 place-items-center rounded-full border border-border/70 bg-card text-ink-soft hover:bg-muted"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-0.5">
          {(["you", "me"] as PersonId[]).map((personId) => (
            <button
              key={personId}
              type="button"
              onClick={() => setDisplayPerson(personId)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.66rem] font-bold transition",
                displayPerson === personId
                  ? "bg-card text-ink shadow-sm"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {data.people[personId].nickname}&apos;s time
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["you", "me"] as PersonId[]).map((personId) => {
          const person = data.people[personId];
          const styles = LANE_STYLES[personId];
          const laneEvents = data.events
            .filter((event) => event.person === personId && event.day === day)
            .sort((a, b) => a.start.localeCompare(b.start));

          return (
            <div key={personId} className={cn("rounded-xl border p-1.5", styles.lane)}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <MascotAvatar name={person.companion} className="h-5 w-5" />
                <span className="truncate text-[0.72rem] font-bold">
                  {person.name}
                </span>
              </div>
              <p className="mb-1.5 truncate rounded-full bg-card/70 px-1.5 py-0.5 text-[0.61rem] font-semibold text-muted-foreground">
                {person.timezone.replace("_", " ")}
              </p>
              <div className="flex flex-col gap-1">
                {laneEvents.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/80 bg-card/60 px-2 py-2 text-[0.66rem] leading-tight text-muted-foreground">
                    Nothing planned — but plans change, so let&apos;s still ask.
                  </p>
                )}
                {laneEvents.slice(0, 4).map((event) => {
                  const interval = eventInterval(event, dates, person.timezone);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "rounded-lg border px-1.5 py-1 shadow-[0_1px_0_0_hsl(var(--border))] transition duration-300 hover:-translate-y-0.5 hover:shadow-note",
                        styles.card,
                        event.ritual && "border-dashed",
                      )}
                    >
                      <p className="truncate text-[0.72rem] font-bold leading-tight">{event.title}</p>
                      <p className="text-[0.62rem] font-semibold tabular-nums text-muted-foreground">
                        {formatClock(interval.start, zone)} – {formatClock(interval.end, zone)}
                      </p>
                    </div>
                  );
                })}
                {laneEvents.length > 4 && (
                  <Link
                    to="/planner"
                    className="rounded-lg bg-card/70 px-1.5 py-0.5 text-center text-[0.62rem] font-bold text-sage"
                  >
                    +{laneEvents.length - 4} more
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-peach/80 bg-peach-soft p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 animate-heart-beat text-coral" aria-hidden />
            <span className="text-[0.78rem] font-bold">Our Time (Overlap)</span>
            {overlaps.length > 1 && (
              <span className="rounded-full bg-card/70 px-1.5 text-[0.61rem] font-bold text-muted-foreground">
                +{overlaps.length - 1} more
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={createCall}
            className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-1 text-[0.66rem] font-bold text-sage shadow-sm transition hover:bg-card/80"
          >
            <Plus className="h-2.5 w-2.5" aria-hidden /> Create call / date
          </button>
        </div>

        {best ? (
          <>
            <p className="mt-1 text-[0.78rem] font-bold tabular-nums">
              {formatClock(best.start, zone)} – {formatClock(best.end, zone)}
              <span className="ml-1.5 rounded-full bg-card/70 px-1.5 py-0.5 text-[0.61rem] font-semibold text-ink-soft">
                {formatDuration(best.minutes)} free
              </span>
            </p>
            <p className="mt-0.5 text-[0.64rem] font-medium text-ink-soft">
              {formatClock(best.start, data.people.you.timezone)} for {data.people.you.nickname} ·{" "}
              {formatClock(best.start, data.people.me.timezone)} for {data.people.me.nickname}
            </p>
            <p className="mt-0.5 text-[0.62rem] text-muted-foreground">
              Both of your open hours, minus every busy block.
            </p>
          </>
        ) : (
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            No overlap on this day yet — try opening a little time in either planner.
          </p>
        )}
      </div>
    </Panel>
  );
}
