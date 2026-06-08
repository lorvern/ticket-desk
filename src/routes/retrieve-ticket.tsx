import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Hash, Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { retrieveTickets } from "@/lib/tickets.functions";
import { formatEventDate, formatGHS } from "@/lib/format";

export const Route = createFileRoute("/retrieve-ticket")({
  head: () => ({
    meta: [
      { title: "Retrieve your tickets — TicketDesk" },
      { name: "description", content: "Look up tickets by email or order reference." },
    ],
  }),
  component: RetrievePage,
});

type Order = Awaited<ReturnType<typeof retrieveTickets>>["orders"][number];

function RetrievePage() {
  const retrieveFn = useServerFn(retrieveTickets);
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);

  async function search() {
    setLoading(true);
    try {
      const r = await retrieveFn({
        data: { email: email.trim() || null, reference: reference.trim().toUpperCase() || null },
      });
      setOrders(r.orders);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold">My tickets</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Find your tickets
        </h1>
        <p className="mt-3 text-muted-foreground">
          Enter the email used at checkout or your order reference.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="email" className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
            or
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref" className="inline-flex items-center gap-2">
              <Hash className="h-4 w-4 text-gold" /> Order reference
            </Label>
            <Input
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="TKD-XXXXXXXX-XXXXXX"
            />
          </div>
          <Button
            variant="ink"
            size="lg"
            className="w-full"
            onClick={search}
            disabled={loading || (!email.trim() && !reference.trim())}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find my tickets"}
          </Button>
        </div>

        {orders !== null && (
          <div className="mt-10 space-y-4">
            {orders.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
                No tickets found. Double-check the email or reference.
              </p>
            )}
            {orders.map((o) => {
              const ev = o.events as { name: string; starts_at: string; venue: string } | null;
              const tickets = (o.tickets ?? []) as Array<{ id: string; ticket_code: string }>;
              return (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {o.reference}
                      </p>
                      <h3 className="mt-1 font-display text-xl">{ev?.name ?? "Event"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ev ? `${formatEventDate(ev.starts_at)} · ${ev.venue}` : ""}
                      </p>
                    </div>
                    <p className="font-display text-lg">{formatGHS(o.total_pesewas)}</p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {tickets.map((t) => (
                      <Link
                        key={t.id}
                        to="/ticket/$id"
                        params={{ id: t.id }}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition hover:border-gold"
                      >
                        <span className="font-mono text-xs">{t.ticket_code}</span>
                        <span className="text-gold">View →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
