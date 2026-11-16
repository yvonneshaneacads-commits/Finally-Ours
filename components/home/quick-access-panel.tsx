import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  Camera,
  Church,
  HandHeart,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { Panel } from "@/components/kit/panel";
import { cn } from "@/lib/utils";
import type { Tint } from "@/components/kit/panel";

const TILES: {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  tone: Tint;
  rotate: string;
}[] = [
  { to: "/planner", label: "Planner", icon: CalendarDays, tone: "powder", rotate: "-rotate-1" },
  { to: "/faith", label: "Faith", icon: Church, tone: "peach", rotate: "rotate-1" },
  { to: "/reading", label: "Reading", icon: BookOpen, tone: "butter", rotate: "rotate-[0.5deg]" },
  { to: "/money", label: "Finances", icon: PiggyBank, tone: "sage", rotate: "-rotate-[0.5deg]" },
  { to: "/prayer-board", label: "Prayer Board", icon: HandHeart, tone: "lilac", rotate: "rotate-1" },
  { to: "/memories", label: "Memories", icon: Camera, tone: "butter", rotate: "-rotate-1" },
];

export function QuickAccessPanel({ className }: { className?: string }) {
  return (
    <Panel
      title="Quick Access"
      icon={<Sparkles className="h-3.5 w-3.5 text-sage" aria-hidden />}
      className={className}
      bodyClassName="p-2.5"
    >
      <div className="stagger-fade grid grid-cols-2 gap-2">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className={cn(
                "group flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/70 px-1 py-2.5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:rotate-1 hover:shadow-note",
                tile.tone === "powder" && "bg-powder",
                tile.tone === "peach" && "bg-peach",
                tile.tone === "butter" && "bg-butter",
                tile.tone === "sage" && "bg-sage-soft",
                tile.rotate,
              )}
            >
              <Icon className="h-4 w-4 text-ink/80 transition group-hover:animate-wiggle" aria-hidden />
              <span className="text-[0.68rem] font-bold text-ink/85">{tile.label}</span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}
