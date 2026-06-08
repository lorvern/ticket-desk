import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import { formatEventDate } from "@/lib/format";

interface EventCardProps {
  event: {
    slug: string;
    name: string;
    venue: string;
    starts_at: string;
    banner_url: string | null;
    category?: string | null;
    is_featured?: boolean;
  };
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      to="/event/$slug"
      params={{ slug: event.slug }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-luxe"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full ink-panel" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {event.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-foreground">
            Featured
          </span>
        )}
        {event.category && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
            {event.category}
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-display text-xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-gold">
          {event.name}
        </h3>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            {formatEventDate(event.starts_at)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gold" />
            {event.venue}
          </span>
        </div>
      </div>
    </Link>
  );
}
