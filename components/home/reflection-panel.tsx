import { Link } from "react-router-dom";
import { ArrowRight, Heart, NotebookPen, Sprout } from "lucide-react";
import { useUniverse } from "@/store/universe";
import { Panel } from "@/components/kit/panel";
import { cn } from "@/lib/utils";

export function ReflectionPanel({ className }: { className?: string }) {
  const { data } = useUniverse();
  const reflection = data.reflections.find((entry) => !entry.archived) ?? data.reflections[0];
  const loves = reflection?.entries.filter((entry) => entry.list === "love").slice(0, 3) ?? [];
  const improves = reflection?.entries.filter((entry) => entry.list === "improve").slice(0, 3) ?? [];

  const columns = [
    {
      title: "Three Things We Love",
      icon: Heart,
      items: loves,
      tone: "bg-sage-soft/80 border-sage/30",
      dot: "text-coral",
    },
    {
      title: "Three Things We Can Improve",
      icon: Sprout,
      items: improves,
      tone: "bg-powder-soft/80 border-powder",
      dot: "text-sage",
    },
  ];

  return (
    <Panel
      title="This Week's Reflection"
      icon={<NotebookPen className="h-3.5 w-3.5 text-sage" aria-hidden />}
      action={<span className="text-[0.64rem]">Sunday check-in</span>}
      className={className}
      bodyClassName="flex flex-col gap-2 p-3"
    >
      {!reflection && (
        <p className="rounded-xl border border-dashed border-border/80 bg-butter-soft/60 px-2.5 py-1.5 text-[0.68rem] leading-snug text-ink-soft">
          Nothing written yet. During a Sunday check-in, add three things you loved and three you&apos;d like to grow.
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
        {columns.map((column) => {
          const Icon = column.icon;
          return (
            <div key={column.title} className={cn("rounded-xl border p-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-sm", column.tone)}>
              <p className="mb-1 flex items-center gap-1 text-[0.7rem] font-bold leading-tight">
                <Icon className={cn("h-3 w-3", column.dot)} aria-hidden />
                {column.title}
              </p>
              <ul className="flex flex-col gap-1">
                {column.items.length === 0 && (
                  <li className="text-[0.66rem] text-muted-foreground">Room for one more thought.</li>
                )}
                {column.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-1 text-[0.68rem] leading-tight">
                    <Heart className="mt-0.5 h-2.5 w-2.5 shrink-0 text-coral/70" aria-hidden />
                    <span>
                      <span className="font-bold">{item.title}.</span>{" "}
                      <span className="text-ink-soft">{item.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <p className="hand text-[0.9rem] leading-tight text-sage">let&apos;s make room for each other</p>
        <Link
          to="/planner#reflection"
          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-1 text-[0.66rem] font-bold text-ink hover:bg-muted"
        >
          View full reflection <ArrowRight className="h-2.5 w-2.5" aria-hidden />
        </Link>
      </div>
    </Panel>
  );
}
