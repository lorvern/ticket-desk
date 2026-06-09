import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type EventFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  venue: string;
  category: string;
  banner_url: string;
  starts_at: string;
  ends_at: string;
  organizer_name: string;
  organizer_contact: string;
  is_featured: boolean;
  status: "draft" | "published" | "archived";
};

const empty: EventFormValues = {
  name: "", slug: "", description: "", venue: "", category: "", banner_url: "",
  starts_at: "", ends_at: "", organizer_name: "", organizer_contact: "",
  is_featured: false, status: "draft",
};

function toLocal(dt?: string | null) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initial, onSubmit, submitting }: {
  initial?: Partial<EventFormValues> & { starts_at?: string | null; ends_at?: string | null };
  onSubmit: (v: EventFormValues) => void;
  submitting?: boolean;
}) {
  const [v, setV] = useState<EventFormValues>({
    ...empty, ...initial,
    starts_at: toLocal(initial?.starts_at as any) || empty.starts_at,
    ends_at: toLocal(initial?.ends_at as any) || empty.ends_at,
  } as EventFormValues);

  function set<K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...v, starts_at: new Date(v.starts_at).toISOString(), ends_at: v.ends_at ? new Date(v.ends_at).toISOString() : "" }); }}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <div>
            <Label>Name</Label>
            <Input required value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Afronation Accra 2026" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Slug (URL)</Label>
              <Input value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={v.category} onChange={(e) => set("category", e.target.value)} placeholder="Festival" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={6} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <Label>Venue</Label>
            <Input required value={v.venue} onChange={(e) => set("venue", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Starts</Label>
              <Input required type="datetime-local" value={v.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
            </div>
            <div>
              <Label>Ends (optional)</Label>
              <Input type="datetime-local" value={v.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Banner image URL</Label>
            <Input value={v.banner_url} onChange={(e) => set("banner_url", e.target.value)} placeholder="https://…" />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Publish</p>
            <div>
              <Label>Status</Label>
              <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={v.status} onChange={(e) => set("status", e.target.value as any)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={v.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
              Feature on home page
            </label>
            <Button variant="ink" size="lg" type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Save event"}
            </Button>
          </Card>
          <Card className="space-y-4 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Organizer</p>
            <div>
              <Label>Name</Label>
              <Input value={v.organizer_name} onChange={(e) => set("organizer_name", e.target.value)} />
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={v.organizer_contact} onChange={(e) => set("organizer_contact", e.target.value)} placeholder="email or phone" />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
