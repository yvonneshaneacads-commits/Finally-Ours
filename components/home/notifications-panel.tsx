import { Link } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Church,
  Heart,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { useUniverse } from "@/store/universe";
import { buildNotifications, type Notice } from "@/lib/notifications";
import { Panel } from "@/components/kit/panel";
import { cn } from "@/lib/utils";

const ICONS: Record<Notice["kind"], typeof Bell> = {
  note: Heart,
  prayer: Church,
  reading: BookOpen,
  money: PiggyBank,
  plan: Sparkles,
  mood: Heart,
};

const TINTS: Record<Notice["kind"], string> = {
  note: "bg-blush",
  prayer: "bg-butter-soft",
  reading: "bg-peach-soft",
  money: "bg-sage-soft",
  plan: "bg-lilac",
  mood: "bg-powder-soft",
};

export function NotificationsPanel({ className }: { className?: string }) {
  const { data } = useUniverse();
  const notices = buildNotifications(data).slice(0, 5);

  return (
    <Panel
      title="Notifications"
      icon={<Bell className="h-3.5 w-3.5 text-sage" aria-hidden />}
      action={<span className="text-[0.64rem]">delivered by Mello</span>}
      className={className}
      bodyClassName="p-2.5"
    >
      <ul className="stagger-fade flex flex-col gap-0.5">
        {notices.map((notice) => {
          const Icon = ICONS[notice.kind];
          return (
            <li key={notice.id}>
              <Link
                to={notice.href}
                className="group flex items-start gap-2 rounded-xl px-1 py-1.5 transition hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[0.6rem] border border-border/50 transition group-hover:animate-wiggle",
                    TINTS[notice.kind],
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-ink/70" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.76rem] font-bold leading-tight">{notice.title}</span>
                  <span className="mt-0.5 block truncate text-[0.68rem] leading-tight text-muted-foreground">
                    {notice.detail}
                  </span>
                  <span className="mt-0.5 block text-[0.61rem] font-semibold text-muted-foreground/80">
                    {notice.when}
                  </span>
                </span>
                <ChevronRight
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-sage"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
