import { useState } from "react";
import { ArrowRight, Heart, Loader2, LogOut, Plus, Ticket } from "lucide-react";
import { ZONES } from "@/lib/types";
import type { Person } from "@/lib/types";
import { MascotAvatar } from "@/components/kit/bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PersonSeed = Omit<Person, "id">;

interface UniverseSetupProps {
  email: string;
  onCreate: (you: PersonSeed, partner: PersonSeed) => Promise<{ error?: string }>;
  onJoin: (code: string, me: PersonSeed) => Promise<{ error?: string }>;
  onSignOut: () => Promise<void>;
}

const COMPANIONS: PersonSeed["companion"][] = ["siamese", "orange", "black"];

const zoneCountry = (timezone: string) => ZONES.find((zone) => zone.id === timezone)?.country ?? "";

function PersonFields({
  person,
  onChange,
  compact = false,
}: {
  person: PersonSeed;
  onChange: (next: PersonSeed) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="col-span-2 block">
        <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Name
        </span>
        <Input
          value={person.name}
          onChange={(event) =>
            onChange({
              ...person,
              name: event.target.value,
              nickname: person.nickname === person.name ? event.target.value : person.nickname,
            })
          }
          placeholder="Yvonne"
        />
      </label>
      {!compact && (
        <label className="block">
          <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Nickname
          </span>
          <Input
            value={person.nickname}
            onChange={(event) => onChange({ ...person, nickname: event.target.value })}
          />
        </label>
      )}
      <label className={cn("block", compact && "col-span-2")}>
        <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          City
        </span>
        <Input
          value={person.city}
          onChange={(event) => onChange({ ...person, city: event.target.value })}
          placeholder="Pasig"
        />
      </label>
      <label className="col-span-2 block">
        <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Time zone
        </span>
        <select
          value={person.timezone}
          onChange={(event) =>
            onChange({
              ...person,
              timezone: event.target.value,
              country: zoneCountry(event.target.value),
            })
          }
          className="h-10 w-full rounded-xl border border-input bg-card px-3 text-[0.82rem]"
        >
          {ZONES.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.city}, {zone.country} · {zone.id}
            </option>
          ))}
        </select>
      </label>
      <div className="col-span-2">
        <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          Companion
        </span>
        <div className="flex items-center gap-1.5">
          {COMPANIONS.map((companion) => (
            <button
              key={companion}
              type="button"
              onClick={() => onChange({ ...person, companion })}
              aria-label={`Choose the ${companion} companion`}
              className={cn(
                "rounded-full border-2 p-0.5 transition",
                person.companion === companion ? "border-sage" : "border-transparent hover:border-border",
              )}
            >
              <MascotAvatar name={companion} className="h-9 w-9" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const makeSeed = (name: string, city: string, timezone: string, companion: PersonSeed["companion"]): PersonSeed => ({
  name,
  nickname: name,
  companion,
  color: companion === "black" ? "powder" : "sage",
  city,
  country: zoneCountry(timezone),
  timezone,
  openFrom: "08:00",
  openTo: "23:30",
});

export function UniverseSetup({ email, onCreate, onJoin, onSignOut }: UniverseSetupProps) {
  const [you, setYou] = useState<PersonSeed>(makeSeed("Yvonne", "Mandaluyong", "Asia/Manila", "orange"));
  const [partner, setPartner] = useState<PersonSeed>(makeSeed("Navjot", "New Delhi", "Asia/Kolkata", "siamese"));
  const [joinMe, setJoinMe] = useState<PersonSeed>(makeSeed("", "New Delhi", "Asia/Kolkata", "siamese"));
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!you.name.trim() || !partner.name.trim()) {
      setError("We need both names — yours and your person's.");
      return;
    }
    setError(null);
    setBusy("create");
    const result = await onCreate(
      { ...you, name: you.name.trim(), nickname: you.nickname.trim() || you.name.trim() },
      { ...partner, name: partner.name.trim(), nickname: partner.nickname.trim() || partner.name.trim() },
    );
    setBusy(null);
    if (result.error) setError(result.error);
  };

  const join = async () => {
    if (!code.trim() || !joinMe.name.trim()) {
      setError("Add the invite code and your name.");
      return;
    }
    setError(null);
    setBusy("join");
    const result = await onJoin(code.trim().toUpperCase(), {
      ...joinMe,
      name: joinMe.name.trim(),
      nickname: joinMe.nickname.trim() || joinMe.name.trim(),
    });
    setBusy(null);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="hand text-[1.1rem] text-sage">one last little step</p>
            <h1 className="text-[1.5rem] font-bold leading-tight">Where should we begin?</h1>
          </div>
          <div className="flex items-center gap-2 text-[0.66rem] text-muted-foreground">
            <span className="hidden sm:inline">{email}</span>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-bold hover:bg-muted"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[0.74rem] font-semibold text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <section className="paper-card grain flex flex-col p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-soft text-sage">
                <Plus className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-[0.95rem] font-bold leading-tight">Start our universe</h2>
                <p className="text-[0.62rem] text-muted-foreground">You'll get a code to share with your person.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-xl border border-border/70 bg-sage-soft/40 p-2.5">
                <p className="mb-1.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-sage">This is me</p>
                <PersonFields person={you} onChange={setYou} />
              </div>
              <div className="rounded-xl border border-border/70 bg-powder-soft/40 p-2.5">
                <p className="mb-1.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
                  Your person
                </p>
                <PersonFields person={partner} onChange={setPartner} compact />
              </div>
            </div>

            <Button className="mt-3 w-full" onClick={create} disabled={busy !== null}>
              {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
              Create our little world
            </Button>
          </section>

          <section className="paper-card grain flex flex-col p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-butter-soft text-sage">
                <Ticket className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-[0.95rem] font-bold leading-tight">Join a universe</h2>
                <p className="text-[0.62rem] text-muted-foreground">
                  If your person already made one, use their six-character code.
                </p>
              </div>
            </div>

            <label className="mb-2 block">
              <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Invite code
              </span>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="A1B2C3"
                maxLength={6}
                className="hand text-center text-[1.4rem] tracking-[0.35em]"
              />
            </label>

            <div className="rounded-xl border border-border/70 bg-peach-soft/40 p-2.5">
              <p className="mb-1.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink-soft">This is me</p>
              <PersonFields person={joinMe} onChange={setJoinMe} compact />
            </div>

            <Button variant="note" className="mt-3 w-full" onClick={join} disabled={busy !== null}>
              {busy === "join" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              Join our universe
            </Button>

            <p className="mt-2 text-[0.6rem] leading-snug text-muted-foreground">
              A universe holds exactly two people. Once your person joins, everything you both write appears on the
              same dashboard — each of you always sees yourself as “you”.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
