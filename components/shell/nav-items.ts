import {
  BookOpen,
  CalendarDays,
  Church,
  Heart,
  HandHeart,
  House,
  Mail,
  PiggyBank,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Tint } from "@/components/kit/panel";

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  tone: Tint;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", short: "Home", icon: House, tone: "sage" },
  { to: "/planner", label: "Planner", short: "Planner", icon: CalendarDays, tone: "powder" },
  { to: "/close", label: "Staying Close", short: "Close", icon: Heart, tone: "blush" },
  { to: "/faith", label: "Faith & Prayer", short: "Faith", icon: Church, tone: "butter" },
  { to: "/reading", label: "Reading", short: "Reading", icon: BookOpen, tone: "peach" },
  { to: "/money", label: "Money & Future", short: "Money", icon: PiggyBank, tone: "sage" },
  { to: "/prayer-board", label: "Prayer Board", short: "Prayers", icon: HandHeart, tone: "lilac" },
  { to: "/memories", label: "Memories & Letters", short: "Memories", icon: Mail, tone: "peach" },
  { to: "/settings", label: "Settings", short: "Settings", icon: Settings2, tone: "cream" },
];
