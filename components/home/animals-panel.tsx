import { PawPrint } from "lucide-react";
import { Panel, TinyStar } from "@/components/kit/panel";
import { MascotAvatar, type CompanionName } from "@/components/kit/bits";
import { cn } from "@/lib/utils";
import { COMPANIONS } from "@/lib/companions";

export function AnimalsPanel({ className }: { className?: string }) {
  return (
    <Panel
      title="Our Animal Friends"
      icon={<PawPrint className="h-3.5 w-3.5 text-sage" aria-hidden />}
      action={<TinyStar className="text-[hsl(342_55%_72%)]" />}
      className={cn("dotty", className)}
      bodyClassName="p-2.5"
    >
      <ul className="stagger-fade flex flex-col gap-1">
        {(Object.keys(COMPANIONS) as CompanionName[]).map((key) => {
          const friend = COMPANIONS[key];
          return (
          <li
            key={key}
            className="flex items-start gap-2.5 rounded-xl border border-transparent px-1.5 py-1.5 transition duration-300 hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/80"
          >
            <MascotAvatar name={key} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="flex items-baseline gap-1 leading-tight">
                <span className="truncate text-[0.78rem] font-bold">{friend.name}</span>
                <span className="text-[0.54rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {friend.species}
                </span>
              </p>
              <p className="text-[0.64rem] font-semibold leading-tight text-ink-soft">{friend.trait}</p>
              <p className="text-[0.62rem] leading-tight text-muted-foreground">{friend.note}</p>
            </div>
          </li>
          );
        })}
      </ul>
      <div className="mt-1 flex items-center justify-center gap-1.5 text-sage/40" aria-hidden>
        <PawPrint className="h-2.5 w-2.5" />
        <PawPrint className="h-2.5 w-2.5" />
        <PawPrint className="h-2.5 w-2.5" />
      </div>
    </Panel>
  );
}
