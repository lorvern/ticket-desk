import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Clock, MapPin, Ticket as TicketIcon, User } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { getEventBySlug } from "@/lib/tickets.functions";
import { formatEventDate, formatEventTime, formatGHS } from "@/lib/format";

const eventQO = (slug: string) =>
  queryOptions({
    queryKey: ["event", slug],
    queryFn: () => getEventBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/event/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(eventQO(params.slug));
    if (!data.event) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.event
      ? [
          { title: `${loaderData.event.name} — TicketDesk` },
          {
            name: "description",
            content: loaderData.event.description?.slice(0, 155) || `Get tickets for ${loaderData.event.name}`,
          },
          { property: "og:title", content: `${loaderData.event.name} — TicketDesk` },
          {
            property: "og:description",
            content: loaderData.event.description?.slice(0, 155) || `Get tickets for ${loaderData.event.name}`,
          },
          ...(loaderData.event.banner_url ? [{ property: "og:image", content: loaderData.event.banner_url }] : []),
        ]
      : [{ title: "Event — TicketDesk" }],
  }),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-2xl">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-4xl">Event not found</h1>
        <p className="mt-2 text-muted-foreground">This event may have been removed or unpublished.</p>
      </div>
    </div>
  ),
  component: EventPage,
});

function EventPage() {
  const { event, categories } = useSuspenseQuery(eventQO(Route.useParams().slug)).data;
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!event) return null;

  const minPrice = categories.length ? Math.min(...categories.map((c) => c.price_pesewas)) : 0;
  const totalRemaining = categories.reduce((sum, c) => sum + (c.quantity - c.sold_count), 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero banner */}
      <section className="relative isolate overflow-hidden">
        {event.banner_url && (
          <img
            src={event.banner_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero-overlay)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-32 lg:px-8 lg:pb-24">
          {event.category && (
            <span className="inline-block rounded-full border border-gold/40 bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold backdrop-blur">
              {event.category}
            </span>
          )}
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            {event.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80 sm:text-base">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              {formatEventDate(event.starts_at)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" />
              {formatEventTime(event.starts_at)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" />
              {event.venue}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-16">
        <div className="space-y-10 lg:col-span-2">
          <div>
            <h2 className="font-display text-2xl">About this event</h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {event.description || "More details coming soon."}
            </p>
          </div>

          {event.organizer_name && (
            <div>
              <h2 className="font-display text-2xl">Organizer</h2>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-ink text-gold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{event.organizer_name}</p>

                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl">Available tickets</h2>
            <div className="mt-4 space-y-3">
              {categories.map((c) => {
                const left = c.quantity - c.sold_count;
                return (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      {c.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{c.description}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {left <= 0 ? "Sold out" : `${left} left`}
                      </p>
                    </div>
                    <p className="font-display text-lg">{formatGHS(c.price_pesewas)}</p>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No tickets currently available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sticky purchase card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="ticket-stub p-6 shadow-luxe">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {minPrice > 0 ? "From" : ""}
            </p>
            <p className="mt-1 font-display text-4xl">
              {minPrice > 0 ? formatGHS(minPrice) : "Free"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalRemaining > 0
                ? `${totalRemaining} tickets remaining`
                : "Sold out"}
            </p>
            <Button
              variant="gold"
              size="xl"
              className="mt-6 w-full"
              disabled={totalRemaining === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              <TicketIcon className="h-5 w-5" />
              Buy tickets
            </Button>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Secured by Paystack · MoMo, Visa, Mastercard, Bank
            </p>
          </div>
        </aside>
      </section>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        event={{ id: event.id, name: event.name }}
        categories={categories}
      />

      <Footer />
    </div>
  );
}
