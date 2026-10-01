import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-xl font-semibold">TicketDesk</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Premium event ticketing in Ghana. Discover events, pay securely and get in with a scan.
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/" className="text-muted-foreground transition hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/" className="text-muted-foreground transition hover:text-foreground">
                All events
              </Link>
            </li>
            <li>
              <Link to="/retrieve-ticket" className="text-muted-foreground transition hover:text-foreground">
                My tickets
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> hello@ticketdesk.gh
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Accra, Ghana
            </li>
            <li className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Support 7 days a week
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Payments</p>
          <p className="mt-4 text-sm text-muted-foreground">
            MTN MoMo · Telecel Cash · AirtelTigo Money
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Visa · Mastercard · Bank transfer</p>
          <p className="mt-3 text-xs text-muted-foreground">Secured by Paystack</p>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} TicketDesk. All rights reserved.</p>
          <p>Made in Ghana</p>
        </div>
      </div>
    </footer>
  );
}
