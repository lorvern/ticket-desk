import { Link } from "@tanstack/react-router";
import { Ticket, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (mounted) setUser(null);
        return;
      }
      if (mounted) setUser({ id: u.user.id });
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") check();
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-gold">
            <Ticket className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">TicketDesk</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Events
          </Link>
          <Link
            to="/retrieve-ticket"
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            My Tickets
          </Link>
          {!user ? (
            <Link
              to="/auth"
              className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-ink-foreground hover:bg-ink/90"
            >
              Sign in
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className="ml-1 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
