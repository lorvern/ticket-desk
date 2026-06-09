import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import {
  adminGetEvent, adminUpsertEvent, adminUpsertCategory, adminDeleteCategory,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatGHS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/events/$id")({
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const getEvent = useServerFn(adminGetEvent);
  const upsert = useServerFn(adminUpsertEvent);
  const upsertCat = useServerFn(adminUpsertCategory);
  const delCat = useServerFn(adminDeleteCategory);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => getEvent({ data: { id } }),
  });

  const saveEvent = useMutation({
    mutationFn: (v: any) => upsert({ data: { ...v, id } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "event", id] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const saveCat = useMutation({
    mutationFn: (v: any) => upsertCat({ data: v }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "event", id] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const removeCat = useMutation({
    mutationFn: (catId: string) => delCat({ data: { id: catId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "event", id] }); },
  });

  if (isLoading || !data) return <AdminShell title="Loading…">Loading…</AdminShell>;

  return (
    <AdminShell title={data.event.name}>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">← Events</Link>
        {data.event.status === "published" && (
          <Link to="/event/$slug" params={{ slug: data.event.slug }}
            className="ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View public page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <EventForm initial={data.event as any} onSubmit={(v) => saveEvent.mutate(v)} submitting={saveEvent.isPending} />

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">Ticket categories</h2>
        </div>
        <div className="grid gap-3">
          {data.categories.map((c: any) => (
            <CategoryRow key={c.id} cat={c} eventId={id}
              onSave={(v: any) => saveCat.mutate(v)}
              onDelete={() => { if (confirm("Delete this ticket category?")) removeCat.mutate(c.id); }}
              saving={saveCat.isPending} />
          ))}
          <NewCategory eventId={id} onCreate={(v: any) => saveCat.mutate(v)} saving={saveCat.isPending} />
        </div>
      </div>
    </AdminShell>
  );
}

function CategoryRow({ cat, eventId, onSave, onDelete, saving }: any) {
  const [name, setName] = useState(cat.name);
  const [priceGhs, setPriceGhs] = useState((cat.price_pesewas / 100).toString());
  const [quantity, setQuantity] = useState(String(cat.quantity));
  const [isVisible, setIsVisible] = useState(cat.is_visible);

  return (
    <Card className="grid items-end gap-3 p-4 md:grid-cols-12">
      <div className="md:col-span-4">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Label className="text-xs">Price (GHS)</Label>
        <Input type="number" min={0} step="0.01" value={priceGhs} onChange={(e) => setPriceGhs(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Label className="text-xs">Quantity</Label>
        <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="md:col-span-2 text-sm">
        <Label className="text-xs">Sold</Label>
        <div className="mt-2 text-sm">{cat.sold_count} / {cat.quantity}</div>
      </div>
      <div className="md:col-span-2 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} /> Visible
        </label>
        <div className="flex gap-2">
          <Button size="sm" variant="ink" disabled={saving}
            onClick={() => onSave({
              id: cat.id, event_id: eventId, name,
              price_pesewas: Math.round(parseFloat(priceGhs || "0") * 100),
              quantity: parseInt(quantity || "0", 10), is_visible: isVisible,
            })}>Save</Button>
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <p className="md:col-span-12 text-xs text-muted-foreground">
        Current revenue (this tier): {formatGHS(cat.price_pesewas * cat.sold_count)}
      </p>
    </Card>
  );
}

function NewCategory({ eventId, onCreate, saving }: any) {
  const [name, setName] = useState("");
  const [priceGhs, setPriceGhs] = useState("");
  const [quantity, setQuantity] = useState("");
  return (
    <Card className="grid items-end gap-3 border-dashed bg-muted/30 p-4 md:grid-cols-12">
      <div className="md:col-span-5">
        <Label className="text-xs">Add new tier</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP" />
      </div>
      <div className="md:col-span-3">
        <Label className="text-xs">Price (GHS)</Label>
        <Input type="number" min={0} step="0.01" value={priceGhs} onChange={(e) => setPriceGhs(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Label className="text-xs">Qty</Label>
        <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Button variant="ink" className="w-full" disabled={saving || !name || !priceGhs || !quantity}
          onClick={() => {
            onCreate({
              event_id: eventId, name,
              price_pesewas: Math.round(parseFloat(priceGhs) * 100),
              quantity: parseInt(quantity, 10),
            });
            setName(""); setPriceGhs(""); setQuantity("");
          }}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </Card>
  );
}
