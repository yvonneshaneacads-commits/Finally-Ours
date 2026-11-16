import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Church,
  HeartHandshake,
  Plane,
  PiggyBank,
  PhoneCall,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useUniverse } from "@/store/universe";
import { currency, formatClock, formatHHmm, weekDates, DAY_LABELS } from "@/lib/time";
import { overlapWindows } from "@/lib/planner";
import { Panel, StickyNote, type Tint } from "@/components/kit/panel";
import { cn } from "@/lib/utils";

interface Row {
  icon: LucideIcon;
  tone: Tint;
  label: string;
  value: string;
  href: string;
  done?: boolean;
}

export function OverviewPanel({ className }: { className?: string }) {
  const { data } = useUniverse();
  const dates = weekDates();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayEvents = data.events.filter((event) => event.day === todayIndex);
  const todayOverlaps = overlapWindows(data.people, todayIndex, dates, data.events, 30);
  const nextOverlap = todayOverlaps[0];

  const dateNight = data.events.find((event) => /date night/i.test(event.title));
  const moodToday = (person: "you" | "me") =>
    data.moods.filter((m) => m.person === person).sort((a, b) => b.date.localeCompare(a.date))[0];
  const bothCheckedIn = Boolean(moodToday("you") && moodToday("me"));

  const pendingPrayers = data.prayers.filter(
    (prayer) => prayer.visibility === "shared" && ["new", "updated", "praying"].includes(prayer.status),
  ).length;

  const plan = data.readingPlans[0];
  const sharedDone = plan
    ? plan.chapters.filter((c) => c.progress.you === "done" && c.progress.me === "done").length
    : 0;

  const visit = data.goals[0];
  const saved = visit ? visit.contributions.reduce((sum, c) => sum + c.amount, 0) : 0;

  const trip = data.trips[0];
  const tripGoal = data.goals[0];
  const monthsToTarget = tripGoal
    ? Math.max(
        0,
        Math.round(
          (new Date(tripGoal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.4),
        ),
      )
    : 0;

  const rows: Row[] = [
    {
      icon: CalendarDays,
      tone: "powder",
      label: "Schedules",
      value: todayEvents.length
        ? `${todayEvents.length} events today`
        : data.events.length
          ? "A clear day"
          : "Add your first plans",
      href: "/planner",
    },
    {
      icon: PhoneCall,
      tone: "sage",
      label: "Next call",
      value: nextOverlap
        ? `Today · ${formatClock(nextOverlap.start, data.people.you.timezone)} – ${formatClock(
            nextOverlap.end,
            data.people.you.timezone,
          )}`
        : "Find a window together",
      href: "/planner",
    },
    {
      icon: HeartHandshake,
      tone: "blush",
      label: "Date night",
      value: dateNight
        ? `Next · ${DAY_LABELS[dateNight.day]} ${formatHHmm(dateNight.start)}`
        : "No ritual planned yet",
      href: "/planner",
    },
    {
      icon: Smile,
      tone: "butter",
      label: "Mood check-in",
      value: bothCheckedIn ? "You both checked in" : "Add today’s check-in",
      href: "/close",
      done: bothCheckedIn,
    },
    {
      icon: Church,
      tone: "peach",
      label: "Prayer requests",
      value: pendingPrayers
        ? `${pendingPrayers} need updates`
        : data.prayers.length
          ? "All gently up to date"
          : "Write your first prayer",
      href: "/faith",
    },
    {
      icon: BookOpen,
      tone: "powder",
      label: "Reading progress",
      value: plan ? `${sharedDone}/${plan.chapters.length} chapters together` : "Start a devotional",
      href: "/reading",
    },
    {
      icon: PiggyBank,
      tone: "sage",
      label: "Shared savings",
      value: visit ? `${currency(saved)} / ${currency(visit.target)}` : "Create your first fund",
      href: "/money",
    },
    {
      icon: Plane,
      tone: "butter",
      label: "Next milestone",
      value: trip ? `${trip.to.split(",")[0]} · ${monthsToTarget} months` : "Plan a visit together",
      href: "/money",
    },
  ];

  return (
    <Panel
      title="Today's Little Overview"
      icon={<CalendarDays className="h-3.5 w-3.5 text-sage" aria-hidden />}
      className={cn("relative", className)}
      bodyClassName="p-0 pb-10"
    >
      <ul className="stagger-fade flex flex-col">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.label} className="border-b border-dashed border-border/70 last:border-0">
              <Link
                to={row.href}
                className="group flex items-center gap-2.5 px-3.5 py-[0.42rem] transition hover:bg-muted/50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[0.6rem] border border-border/50 bg-card/80 text-ink-soft transition-transform duration-300 group-hover:animate-wiggle">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[0.82rem] font-bold leading-tight text-ink">
                    {row.label}
                    {row.done && (
                      <span className="rounded-full bg-sage-soft px-1.5 text-[0.61rem] font-bold text-sage">
                        done
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[0.7rem] font-medium leading-snug text-muted-foreground">
                    {row.value}
                  </span>
                </span>
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-sage"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <StickyNote
        tone="peach"
        className="absolute bottom-2 right-2 w-[6.6rem] rotate-[-2deg] px-2 py-1.5"
      >
        small prayers, held together
      </StickyNote>
    </Panel>
  );
}
