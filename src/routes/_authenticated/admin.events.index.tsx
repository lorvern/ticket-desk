import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListEvents, adminDeleteEvent } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Calendar, MapPin } from "lucide-react";
import { formatEventDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/events/")({
  component: EventsList,
});

function EventsList() {
  const fetchEvents = useServerFn(adminListEvents);
  const delFn = useServerFn(adminDeleteEvent);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "events"], queryFn: () => fetchEvents(),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Event deleted");
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  return (
    <AdminShell title="Events">
      <div className="mb-4 flex justify-end">
        <Button asChild variant="ink"><Link to="/admin/events/new"><Plus className="h-4 w-4" /> New event</Link></Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="grid gap-3">
        {(data?.events ?? []).map((e: any) => {
          const pct = e.capacity > 0 ? Math.round((e.sold / e.capacity) * 100) : 0;
          return (
            <Card key={e.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    e.status === "published" ? "bg-emerald-100 text-emerald-800" :
                    e.status === "draft" ? "bg-amber-100 text-amber-800" :
                    "bg-muted text-muted-foreground"
                  }`}>{e.status}</span>
                  {e.is_featured && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-foreground">Featured</span>}
                  <h3 className="font-display text-lg">{e.name}</h3>
                </div>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatEventDate(e.starts_at)}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.venue}</span>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{e.sold} / {e.capacity} sold</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/events/$id" params={{ id: e.id }}><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (confirm(`Delete "${e.name}"? This removes all its tickets and orders.`)) del.mutate(e.id);
                }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
        {!isLoading && (data?.events?.length ?? 0) === 0 && (
          <p className="py-16 text-center text-muted-foreground">No events yet. Create your first one.</p>
        )}
      </div>
    </AdminShell>
  );
}
