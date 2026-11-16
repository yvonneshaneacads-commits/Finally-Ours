import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  House,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNow, useUniverse } from "@/store/universe";
import { buildNotifications } from "@/lib/notifications";
import { formatClock, formatDateIn } from "@/lib/time";
import { NAV_ITEMS } from "./nav-items";
import { tintChip } from "@/components/kit/panel";
import { MascotAvatar, WALLPAPER_URL } from "@/components/kit/bits";
import { AmbientLayer } from "@/components/kit/ambient";
import { MusicMenu } from "@/components/music/music-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function BrandMark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-[0.9rem] border border-border/70 bg-butter-soft shadow-sm transition duration-300 group-hover/logo:-rotate-6">
      <House className="h-4 w-4 text-sage" aria-hidden />
    </span>
  );
}

function TopBar() {
  const { data, mutate, syncState } = useUniverse();
  const now = useNow(30000);
  const timezone = data.people.you.timezone;
  const notices = buildNotifications(data);
  const isDark = data.settings.theme === "dark";
  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/95 shadow-[0_1px_0_0_hsl(var(--card))] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1680px] items-center gap-3 px-3 sm:px-4">
        <div className="hidden items-center gap-1.5 pr-1 md:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(6_62%_68%)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(42_80%_68%)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(96_32%_62%)]" />
        </div>
        <Link to="/" className="group/logo flex min-w-0 items-center gap-2">
          <BrandMark />
          <MascotAvatar name="parakeet" className="hidden h-7 w-7 sm:inline-block" />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="hand truncate text-[1.42rem] font-semibold leading-none text-sage">Our Little Universe</span>
            <span className="mt-1 hidden truncate text-[0.62rem] font-medium tracking-wide text-muted-foreground sm:block">
              Two lives, three time zones, one shared dream.
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 sm:flex">
            <span className="text-[0.68rem] font-semibold text-muted-foreground">
              {formatDateIn(now, timezone, true)}
            </span>
            <span className="h-3 w-px bg-border" aria-hidden />
            <span className="text-[0.72rem] font-bold tabular-nums">{formatClock(now, timezone)}</span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                syncState === "error" ? "bg-coral" : syncState === "saving" ? "bg-[hsl(42_80%_62%)]" : "bg-sage/70",
              )}
              title={syncState === "saving" ? "Saving…" : syncState === "error" ? "Will retry on next change" : "Synced"}
              aria-label={syncState === "saving" ? "Saving" : syncState === "error" ? "Sync needs a retry" : "Synced"}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-full border border-transparent text-ink-soft transition hover:border-border hover:bg-muted/70"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[19rem] rounded-2xl border-border/80 bg-card p-2 shadow-lift"
            >
              <DropdownMenuLabel className="hand px-2 text-[1.05rem] text-sage">
                Little things waiting for you
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/70" />
              {notices.slice(0, 4).map((notice) => (
                <DropdownMenuItem key={notice.id} asChild className="cursor-pointer rounded-xl p-2">
                  <Link to={notice.href} className="flex flex-col gap-0.5">
                    <span className="text-[0.82rem] font-semibold">{notice.title}</span>
                    <span className="line-clamp-1 text-[0.7rem] text-muted-foreground">{notice.detail}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <MusicMenu />

          <button
            type="button"
            onClick={() =>
              mutate((draft) => ({
                ...draft,
                settings: { ...draft.settings, theme: isDark ? "light" : "dark" },
              }))
            }
            aria-label={isDark ? "Switch to daylight mode" : "Switch to dusk mode"}
            className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background/70 text-ink-soft transition hover:bg-muted"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1 pl-1 pr-2.5 ring-1 ring-blush/60 transition hover:bg-muted"
            aria-label="Your profile and settings"
          >
            <MascotAvatar name={data.people.you.companion} className="h-7 w-7" />
            <span className="hidden text-[0.72rem] font-bold sm:block">{data.people.you.nickname}</span>
            <ChevronRight className="hidden h-3 w-3 text-muted-foreground sm:block" />
          </Link>
        </div>
      </div>

    </header>
    </>
  );
}

function SideRail() {
  return (
    <aside className="grain sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[112px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/60 bg-sidebar px-2 py-3 lg:flex">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center transition duration-300 hover:-translate-y-0.5",
                isActive ? "bg-card shadow-card" : "hover:bg-card/60",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-2xl border border-border/50 transition duration-300 group-hover:-rotate-3 group-hover:scale-105",
                    tintChip[item.tone],
                    isActive && "shadow-sm ring-1 ring-sage/30",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-[0.66rem] font-semibold leading-tight text-ink-soft",
                    isActive && "text-sage",
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
      <div className="mt-auto rounded-xl border border-dashed border-border/80 bg-butter-soft/70 px-2 py-2 text-center">
        <Sparkles className="mx-auto mb-1 h-3 w-3 text-sage" aria-hidden />
        <p className="hand text-[0.85rem] leading-tight text-ink/70">
          good things take time, love
        </p>
      </div>
    </aside>
  );
}

function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Sections"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-card/95 backdrop-blur-md lg:hidden"
    >
      <div className="flex items-stretch gap-0.5 overflow-x-auto px-1.5 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-[62px] flex-col items-center gap-0.5 rounded-xl px-1 py-1 transition active:scale-95",
                active ? "bg-muted/80" : "",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-2xl",
                  tintChip[item.tone],
                  active && "ring-1 ring-sage/40",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className={cn("text-[0.58rem] font-semibold", active ? "text-sage" : "text-ink-soft")}>
                {item.short}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const WALLPAPER_STYLES: Record<string, string> = {
  room: "opacity-[0.55]",
  meadow: "opacity-[0.32] saturate-[0.85]",
  dusk: "opacity-[0.38] saturate-[0.75] brightness-[0.92]",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = useUniverse();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={WALLPAPER_URL}
          alt=""
          crossOrigin="anonymous"
          className={cn(
            "h-full w-full object-cover object-right-bottom transition-opacity duration-500",
            WALLPAPER_STYLES[data.settings.wallpaper] ?? WALLPAPER_STYLES.room,
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-transparent to-background/85" />
      </div>

      <AmbientLayer />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <TopBar />
        <div className="flex flex-1">
          <SideRail />
          <main className="min-w-0 flex-1 px-3 pb-28 pt-4 sm:px-5 lg:pb-10">
            <div key={pathname} className="page-enter mx-auto w-full max-w-[1560px]">
              {children}
            </div>
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
