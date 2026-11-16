import { ArrowRight, Clock3, Compass, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useNow, useUniverse } from "@/store/universe";
import { formatDiff, formatWeekday, zoneDifference } from "@/lib/time";
import { LiveClock, MascotAvatar } from "@/components/kit/bits";
import { Panel } from "@/components/kit/panel";
import { cn } from "@/lib/utils";
import type { PersonId } from "@/lib/types";

function PersonTime({ personId }: { personId: PersonId }) {
  const { data } = useUniverse();
  const person = data.people[personId];
  const now = useNow(30000);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <MascotAvatar name={person.companion} className="h-5 w-5" />
        <span className="truncate text-[0.74rem] font-bold text-ink">
          {person.name}
        </span>
      </div>
      <div className="flex items-start gap-1 text-[0.72rem] font-semibold text-muted-foreground">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-sage" aria-hidden />
        <span className="leading-tight">
          {person.city}, {person.country}
          <span className="block text-[0.66rem] font-medium text-muted-foreground/90">
            ({person.timezone.replace("_", " ")})
          </span>
        </span>
      </div>
      <LiveClock timezone={person.timezone} className="mt-0.5" />
      <span className="flex items-center gap-1 text-[0.66rem] font-semibold text-muted-foreground">
        <Clock3 className="h-2.5 w-2.5" aria-hidden />
        {formatWeekday(now, person.timezone)}
      </span>
    </div>
  );
}

export function LocationsPanel({ className }: { className?: string }) {
  const { data } = useUniverse();
  const now = useNow(60000);
  const diff = zoneDifference(
    data.people.you.timezone,
    data.people.me.timezone,
    now,
  );

  return (
    <Panel
      title="Our Locations & Time"
      icon={<Compass className="h-3.5 w-3.5 text-sage" aria-hidden />}
      className={cn("relative", className)}
      bodyClassName="p-3.5 pb-14 sm:p-4 sm:pb-14"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <PersonTime personId="you" />

        <div className="flex h-full flex-col items-center justify-center gap-2 self-stretch">
          <span className="h-full w-px border-l border-dashed border-border" aria-hidden />
          <span className="rotate-[-2deg] whitespace-nowrap rounded-full border border-border/80 bg-butter-soft px-2 py-1 text-[0.64rem] font-bold text-ink/80 shadow-sm">
            {formatDiff(diff)}
          </span>
          <span className="h-full w-px border-l border-dashed border-border" aria-hidden />
        </div>

        <PersonTime personId="me" />
      </div>

      <div className="absolute bottom-2 right-3 z-10 w-[11.5rem] rotate-[2.4deg] rounded-[0.6rem] border border-border/70 bg-blush px-3 py-2 shadow-note">
        <span className="washi absolute -top-2 left-1/2 h-4 w-9 -translate-x-1/2 rotate-[-4deg] rounded-[2px] opacity-90" />
        <p className="hand text-[0.92rem] leading-tight text-ink/85">New message from your partner!</p>
        <Link
          to="/close"
          className="mt-1 inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/80 px-2 py-0.5 text-[0.68rem] font-bold text-sage hover:bg-card"
        >
          View <ArrowRight className="h-2.5 w-2.5" aria-hidden />
        </Link>
      </div>
    </Panel>
  );
}
