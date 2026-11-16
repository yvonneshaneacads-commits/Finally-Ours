import { useState } from "react";
import { Heart, KeyRound, Loader2, Mail, Sparkles } from "lucide-react";
import { WALLPAPER_URL, CompanionGroup } from "@/components/kit/bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<{
    error?: string;
  }>;
  onSignUp: (email: string, password: string) => Promise<{
    error?: string;
  }>;
}
export function AuthScreen({
  onSignIn,
  onSignUp
}: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("We need both an email and a password, love.");
      return;
    }
    setBusy(true);
    const result = mode === "signin" ? await onSignIn(email.trim(), password) : await onSignUp(email.trim(), password);
    setBusy(false);
    if (result.error) setError(result.error);
  };
  return <div className="relative min-h-[100dvh] overflow-hidden bg-background px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img src={WALLPAPER_URL} alt="" crossOrigin="anonymous" className="h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[980px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-lift md:grid-cols-[1.05fr_1fr]">
          <div className="relative hidden min-h-[430px] bg-butter-soft md:block">
            <CompanionGroup className="h-full w-full object-cover object-[55%_45%] dark:brightness-[0.85]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card/95 via-card/50 to-transparent p-4">
              
              
            </div>
          </div>

          <div className="grain relative p-6 sm:p-8">
            
            <h1 className="hand mt-2 text-[2rem] leading-none text-ink" style={{
            fontFamily: "Cormorant Garamond"
          }}>Our Little Universe</h1>
            <p className="mt-1 text-[0.76rem] leading-snug text-muted-foreground">
              {mode === "signin" ? "Welcome back. Your week, your prayers and your little plans are waiting." : "Make a quiet account — then invite the one person who belongs here."}
            </p>

            <div className="mt-3 flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-0.5">
              <button type="button" onClick={() => {
              setMode("signin");
              setError(null);
            }} className={`flex-1 rounded-full px-2 py-1.5 text-[0.68rem] font-bold transition ${mode === "signin" ? "bg-card text-ink shadow-sm" : "text-muted-foreground"}`}>
                Sign in
              </button>
              <button type="button" onClick={() => {
              setMode("signup");
              setError(null);
            }} className={`flex-1 rounded-full px-2 py-1.5 text-[0.68rem] font-bold transition ${mode === "signup" ? "bg-card text-ink shadow-sm" : "text-muted-foreground"}`}>
                Create account
              </button>
            </div>

            <form className="mt-3 space-y-2.5" onSubmit={submit}>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <Mail className="h-3 w-3" aria-hidden /> Email
                </span>
                <Input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <KeyRound className="h-3 w-3" aria-hidden /> Password
                </span>
                <Input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least six characters" />
              </label>

              {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[0.7rem] font-semibold text-destructive">
                  {error}
                </p>}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
                {mode === "signin" ? "Open our universe" : "Create our account"}
              </Button>
            </form>

            <p className="mt-3 text-center text-[0.6rem] leading-snug text-muted-foreground">
              Only the two people in a universe can read what is inside it. Private notes stay with their author.
            </p>
          </div>
        </div>
      </div>
    </div>;
}