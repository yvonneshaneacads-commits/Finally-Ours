import { Link } from "react-router-dom";
import { ArrowRight, Home, PiggyBank, Plus, Target, Wallet } from "lucide-react";
import { useUniverse } from "@/store/universe";
import { currency } from "@/lib/time";
import { Panel } from "@/components/kit/panel";
import { MascotAvatar, SoftProgress, WALLPAPER_URL } from "@/components/kit/bits";
import { cn } from "@/lib/utils";

const GOAL_ICONS = [PiggyBank, Wallet, Target, Home];

export function GoalsPanel({ className }: { className?: string }) {
  const { data } = useUniverse();
  const goals = data.goals;
  const featured = goals[0];

  if (!featured) {
    return (
      <Panel title="Shared Goals" className={className}>
        <div className="flex flex-col items-center gap-2 px-3 py-5 text-center">
          <MascotAvatar name="betta" className="h-11 w-11" />
          <p className="hand text-[1.15rem] leading-tight text-sage">A blank page for our future</p>
          <p className="max-w-[30ch] text-[0.7rem] leading-snug text-muted-foreground">
            Name a fund, set the target, then add what each of you puts in. Progress and the finish date work
            themselves out.
          </p>
          <Link
            to="/money"
            className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-3 py-1 text-[0.76rem] font-bold text-sage hover:bg-sage/15"
          >
            <Plus className="h-3 w-3" /> Create our first fund
          </Link>
        </div>
      </Panel>
    );
  }

  const saved = featured.contributions.reduce((sum, c) => sum + c.amount, 0);
  const pct = Math.round((saved / featured.target) * 100);
  const monthly = data.trips[0]?.monthly ?? 4000;
  const monthsLeft = Math.max(1, Math.ceil((featured.target - saved) / monthly));
  const eta = new Date();
  eta.setMonth(eta.getMonth() + monthsLeft);

  return (
    <Panel
      title="Shared Goals"
      icon={<Target className="h-3.5 w-3.5 text-sage" aria-hidden />}
      action={
        <Link to="/money" className="inline-flex items-center gap-0.5 hover:text-sage">
          View all goals <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      }
      className={className}
      bodyClassName="space-y-2.5 p-3"
    >
      <Link
        to="/money"
        className="hover-lift relative flex items-stretch gap-2.5 overflow-hidden rounded-xl border border-border/70 bg-card p-2 shadow-sm"
      >
        <div className="relative h-[74px] w-[92px] shrink-0 overflow-hidden rounded-lg border border-border/60">
          <img
            src={WALLPAPER_URL}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full object-cover object-[72%_70%] dark:brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-card/20" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[0.85rem] font-bold">{featured.title}</p>
            <span className="hand text-[1.05rem] leading-none text-sage">{pct}%</span>
          </div>
          <SoftProgress value={pct} tone="sage" height="h-2" />
          <div className="flex flex-wrap items-center justify-between gap-x-2 text-[0.66rem] font-semibold text-muted-foreground">
            <span className="tabular-nums text-ink">
              {currency(saved)} <span className="text-muted-foreground">/ {currency(featured.target)}</span>
            </span>
            <span>
              {currency(monthly)}/mo · est.{" "}
              {eta.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-1.5">
        {goals.slice(0, 4).map((goal, index) => {
          const Icon = GOAL_ICONS[index % GOAL_ICONS.length];
          const goalSaved = goal.contributions.reduce((sum, c) => sum + c.amount, 0);
          const goalPct = Math.round((goalSaved / goal.target) * 100);
          return (
            <Link
              key={goal.id}
              to="/money"
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-[0.66rem] font-bold transition hover:-translate-y-0.5",
                goal.accent === "sage" && "bg-sage-soft",
                goal.accent === "powder" && "bg-powder-soft",
                goal.accent === "blush" && "bg-blush",
                goal.accent === "butter" && "bg-butter-soft",
                goal.accent === "peach" && "bg-peach-soft",
                goal.accent === "lilac" && "bg-lilac",
              )}
              title={`${goal.title} · ${goalPct}%`}
            >
              <Icon className="h-3 w-3 text-ink/70" aria-hidden />
              <span className="capitalize">{goal.title}</span>
              <span className="text-muted-foreground">{goalPct}%</span>
            </Link>
          );
        })}
        <Link
          to="/money"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-card/60 px-2 py-1 text-[0.66rem] font-bold text-muted-foreground hover:text-sage"
        >
          <Plus className="h-3 w-3" aria-hidden /> Add goal
        </Link>
      </div>
    </Panel>
  );
}
