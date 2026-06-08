import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Calendar, MapPin, Printer, Download, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTicket } from "@/lib/tickets.functions";
import { formatEventDate, formatEventTime } from "@/lib/format";

const ticketQO = (id: string) =>
  queryOptions({
    queryKey: ["ticket", id],
    queryFn: () => getTicket({ data: { id } }),
  });

export const Route = createFileRoute("/ticket/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(ticketQO(params.id));
    if (!data.ticket) throw notFound();
    return data;
  },
  head: () => ({ meta: [{ title: "Your Ticket — TicketDesk" }, { name: "robots", content: "noindex" }] }),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-3xl">Ticket not found</h1>
        <Link to="/retrieve-ticket" className="mt-3 inline-block text-gold underline">
          Look up your tickets
        </Link>
      </div>
    </div>
  ),
  component: TicketPage,
});

function TicketPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(ticketQO(id));
  const ticket = data.ticket as {
    id: string;
    ticket_code: string;
    qr_payload: string;
    status: string;
    attendee_name: string | null;
    events: { name: string; venue: string; starts_at: string; banner_url: string | null } | null;
    orders: { reference: string; buyer_name: string; buyer_email: string } | null;
    ticket_categories: { name: string } | null;
  };

  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(ticket.qr_payload, {
      width: 480,
      margin: 1,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setQrUrl);
  }, [ticket.qr_payload]);

  return (
    <div className="min-h-screen bg-background py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            {qrUrl && (
              <Button variant="ink" size="sm" asChild>
                <a href={qrUrl} download={`ticket-${ticket.ticket_code}.png`}>
                  <Download className="h-4 w-4" /> QR
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="ticket-stub overflow-hidden print:shadow-none">
          {/* Top: event banner */}
          <div className="relative h-40 overflow-hidden bg-ink">
            {ticket.events?.banner_url && (
              <img src={ticket.events.banner_url} alt="" className="h-full w-full object-cover opacity-70" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Admit one</p>
              <h1 className="mt-1 font-display text-2xl text-white">{ticket.events?.name}</h1>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3 text-sm">
              <Row label="Attendee" value={ticket.attendee_name ?? ticket.orders?.buyer_name ?? ""} />
              <Row label="Ticket" value={ticket.ticket_categories?.name ?? ""} />
              <Row
                label="Date"
                value={
                  ticket.events
                    ? `${formatEventDate(ticket.events.starts_at)} · ${formatEventTime(ticket.events.starts_at)}`
                    : ""
                }
                icon={<Calendar className="h-3.5 w-3.5 text-gold" />}
              />
              <Row label="Venue" value={ticket.events?.venue ?? ""} icon={<MapPin className="h-3.5 w-3.5 text-gold" />} />
              <Row label="Order" value={ticket.orders?.reference ?? ""} mono />
              <Row label="Ticket ID" value={ticket.ticket_code} mono />
            </div>

            <div className="flex flex-col items-center gap-2">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR code"
                  className="h-44 w-44 rounded-lg border border-border bg-white p-2"
                />
              ) : (
                <div className="h-44 w-44 animate-pulse rounded-lg bg-muted" />
              )}
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  ticket.status === "valid" ? "text-emerald-700" : "text-destructive"
                }`}
              >
                {ticket.status === "valid" ? "Valid" : ticket.status}
              </p>
            </div>
          </div>

          {/* Perforation + footer */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 flex justify-between px-3 text-border" aria-hidden>
              {Array.from({ length: 40 }).map((_, i) => (
                <span key={i} className="-mt-1.5 block h-3 w-1 rounded-full bg-background" />
              ))}
            </div>
            <div className="border-t border-dashed border-border bg-secondary/30 px-6 py-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              TicketDesk · Single-use · Show QR at the gate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2">
      <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`inline-flex items-center gap-1.5 ${mono ? "font-mono text-xs" : "font-medium"}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
