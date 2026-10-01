import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Search, Calendar, MapPin, ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { EventCard } from "@/components/site/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listEvents } from "@/lib/tickets.functions";
import heroImg from "@/assets/hero-event.jpg";
import { formatEventDate } from "@/lib/format";

const eventsQO = queryOptions({
  queryKey: ["events", "all"],
  queryFn: () => listEvents(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TicketDesk — Premium Event Ticketing in Ghana" },
      {
        name: "description",
        content:
          "Discover concerts, festivals, conferences and gala events in Ghana. Buy tickets in seconds with Mobile Money, card or bank.",
      },
      { property: "og:title", content: "TicketDesk — Premium Event Ticketing in Ghana" },
      {
        property: "og:description",
        content: "Buy event tickets in seconds. Mobile Money · Visa · Mastercard.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQO),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(eventsQO);
  const events = data.events;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[],
    [events],
  );

  const featured = events.find((e) => e.is_featured) ?? events[0];

  const filtered = events.filter((e) => {
    const matchesQ =
      !query ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.venue.toLowerCase().includes(query.toLowerCase());
    const matchesC = !category || e.category === category;
    return matchesQ && matchesC;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero-overlay)" }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-24 sm:px-6 sm:py-32 lg:py-40 lg:px-8">
          <span className="rounded-full border border-gold/40 bg-black/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold backdrop-blur">
            Premium Event Ticketing · Ghana
          </span>
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Tickets to the moments <span className="gold-text">worth showing up for.</span>
          </h1>
          <p className="max-w-xl text-base text-white/80 sm:text-lg">
            Concerts, festivals, galas and conferences across Accra and beyond. Buy in seconds
            with Mobile Money, Visa or bank — no account required.
          </p>

          <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-black/40 p-2 backdrop-blur-md">
            <Search className="ml-2 h-5 w-5 text-white/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, venues, artists"
              className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0"
            />
            <Button
              variant="gold"
              size="lg"
              onClick={() =>
                document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Browse
            </Button>
          </div>
        </div>

        {/* Featured strip */}
        {featured && (
          <div className="relative mx-auto -mb-12 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate({ to: "/event/$slug", params: { slug: featured.slug } })}
              className="group flex w-full flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/60 p-5 text-left text-white backdrop-blur-md transition hover:border-gold/50 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Featured</p>
                <p className="mt-1 font-display text-xl">{featured.name}</p>
                <p className="mt-1 flex items-center gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatEventDate(featured.starts_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {featured.venue}
                  </span>
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gold transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </section>

      {/* EVENTS */}
      <section id="events" className="mx-auto mt-20 w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Upcoming</p>
            <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
              All events
            </h2>
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory(null)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  !category
                    ? "border-ink bg-ink text-ink-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    category === c
                      ? "border-ink bg-ink text-ink-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EventCard key={e.slug} event={e} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-20 text-center text-muted-foreground">
              No events match your search.
            </p>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">How it works</p>
            <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
              From browsing to the front gate in three steps
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Find your event",
                body: "Browse concerts, festivals, conferences and galas happening across Ghana — search by name, city or venue.",
              },
              {
                step: "02",
                title: "Pay in seconds",
                body: "Checkout with Mobile Money, Visa, Mastercard or bank transfer through Paystack. No account needed.",
              },
              {
                step: "03",
                title: "Scan and walk in",
                body: "Your ticket arrives instantly with a unique QR code. Show it at the gate and you're in.",
              },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-border/60 bg-background p-8">
                <span className="font-display text-5xl font-semibold text-gold/30">{s.step}</span>
                <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TICKETDESK */}
      <section id="why-us" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Why TicketDesk</p>
            <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
              Built for unforgettable nights
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Whether you're coming to the show or running it, everything you need lives in one
              place — no spreadsheets, no cash queues, no lost guest lists.
            </p>
            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "Secure payments",
                  body: "Every transaction is processed by Paystack with fraud protection and instant confirmation.",
                },
                {
                  title: "Instant QR tickets",
                  body: "Each ticket carries a unique QR code that venue staff can scan at the door in seconds.",
                },
                {
                  title: "Real-time sales analytics",
                  body: "Organizers track revenue, orders and top events live from a single dashboard.",
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15">
                    <Check className="h-4 w-4 text-gold" />
                  </span>
                  <div>
                    <p className="font-medium">{f.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative hidden overflow-hidden rounded-3xl lg:block">
            <img
              src={heroImg}
              alt="Crowd enjoying a live event"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "var(--gradient-hero-overlay)" }} />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section id="stats" className="bg-ink py-16 text-ink-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 text-center sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: "150+", label: "Events hosted" },
            { value: "25,000+", label: "Tickets sold" },
            { value: "12", label: "Cities covered" },
            { value: "98%", label: "Happy attendees" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-semibold sm:text-5xl">
                <span className="gold-text">{s.value}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gold/20 bg-secondary/40 px-6 py-16 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold sm:text-5xl">
            Don't miss the moments <span className="gold-text">worth showing up for.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join the list and be the first to hear about new events, early-bird prices and
            exclusive presales.
          </p>
          <form
            className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSubscribed(true);
            }}
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1"
            />
            <Button type="submit" variant="gold" size="lg">
              Notify me
            </Button>
          </form>
          {subscribed && (
            <p className="mt-4 text-sm font-medium text-gold">
              You're on the list — we'll let you know when new events drop.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
