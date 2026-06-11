import { Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";

export function Navbar() {
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
        </nav>
      </div>
    </header>
  );
}
