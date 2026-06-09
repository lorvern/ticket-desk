import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, CalendarDays, ShoppingBag, LogOut, Ticket, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const NAV: Array<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-gold">
            <Ticket className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold">TicketDesk</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Admin</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-ink text-ink-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View public site
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="justify-start">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-8">
          <h1 className="font-display text-xl">{title ?? "Admin"}</h1>
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
