import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Helpers ----------
async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// ---------- Schemas ----------
const eventSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  venue: z.string().trim().min(2).max(200),
  category: z.string().trim().max(60).optional().nullable(),
  banner_url: z.string().trim().url().max(500).optional().nullable(),
  starts_at: z.string().min(1),
  ends_at: z.string().optional().nullable(),
  organizer_name: z.string().trim().max(200).optional().nullable(),
  organizer_contact: z.string().trim().max(200).optional().nullable(),
  is_featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const categorySchema = z.object({
  id: z.string().uuid().optional().nullable(),
  event_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  price_pesewas: z.number().int().min(0).max(100_000_000),
  quantity: z.number().int().min(1).max(1_000_000),
  sort_order: z.number().int().min(0).max(1000).optional(),
  is_visible: z.boolean().optional(),
  sale_starts_at: z.string().optional().nullable(),
  sale_ends_at: z.string().optional().nullable(),
});

// ---------- Me / role ----------
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return {
      userId: context.userId,
      roles: (data ?? []).map((r) => r.role),
      isAdmin: (data ?? []).some((r) => r.role === "admin"),
    };
  });

// ---------- Events ----------
export const adminListEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*, ticket_categories(id, quantity, sold_count, price_pesewas)")
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    const events = (data ?? []).map((e: any) => {
      const cats = e.ticket_categories ?? [];
      const capacity = cats.reduce((s: number, c: any) => s + (c.quantity ?? 0), 0);
      const sold = cats.reduce((s: number, c: any) => s + (c.sold_count ?? 0), 0);
      return { ...e, capacity, sold };
    });
    return { events };
  });

export const adminGetEvent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!event) throw new Error("Event not found");
    const { data: cats } = await supabaseAdmin
      .from("ticket_categories")
      .select("*")
      .eq("event_id", data.id)
      .order("sort_order", { ascending: true });
    return { event, categories: cats ?? [] };
  });

export const adminUpsertEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => eventSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(data.name);
    const payload = {
      name: data.name,
      slug,
      description: data.description ?? null,
      venue: data.venue,
      category: data.category ?? null,
      banner_url: data.banner_url ?? null,
      starts_at: data.starts_at,
      ends_at: data.ends_at ?? null,
      organizer_name: data.organizer_name ?? null,
      organizer_contact: data.organizer_contact ?? null,
      is_featured: data.is_featured ?? false,
      status: data.status ?? "draft",
    };
    if (data.id) {
      const { data: updated, error } = await supabaseAdmin
        .from("events").update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return { event: updated };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("events").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { event: inserted };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Ticket categories ----------
export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => categorySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      event_id: data.event_id,
      name: data.name,
      description: data.description ?? null,
      price_pesewas: data.price_pesewas,
      quantity: data.quantity,
      sort_order: data.sort_order ?? 0,
      is_visible: data.is_visible ?? true,
      sale_starts_at: data.sale_starts_at ?? null,
      sale_ends_at: data.sale_ends_at ?? null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("ticket_categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabaseAdmin.from("ticket_categories").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ticket_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Orders ----------
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      status: z.enum(["all", "pending", "paid", "failed", "refunded"]).optional(),
      eventId: z.string().uuid().optional().nullable(),
      limit: z.number().int().min(1).max(200).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select("id, reference, buyer_name, buyer_email, buyer_phone, total_pesewas, status, created_at, paid_at, event_id, events(name, slug), tickets(id)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.eventId) q = q.eq("event_id", data.eventId);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

// ---------- Analytics ----------
export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: paidOrders }, { count: totalEvents }, { count: ticketsIssued }, { data: recent }] =
      await Promise.all([
        supabaseAdmin.from("orders").select("total_pesewas, created_at, event_id, events(name)").eq("status", "paid"),
        supabaseAdmin.from("events").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("tickets").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("orders")
          .select("id, reference, buyer_name, total_pesewas, status, created_at, events(name)")
          .order("created_at", { ascending: false }).limit(8),
      ]);

    const orders = paidOrders ?? [];
    const grossPesewas = orders.reduce((s, o) => s + Number(o.total_pesewas), 0);
    const ordersCount = orders.length;

    // Last 14 days revenue
    const days: { date: string; revenue: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), revenue: 0 });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const o of orders) {
      const k = (o.created_at as string).slice(0, 10);
      const row = byDate.get(k);
      if (row) row.revenue += Number(o.total_pesewas);
    }

    // Top events by revenue
    const eventTotals = new Map<string, { name: string; revenue: number; orders: number }>();
    for (const o of orders) {
      const name = (o.events as any)?.name ?? "Unknown";
      const key = o.event_id as string;
      const cur = eventTotals.get(key) ?? { name, revenue: 0, orders: 0 };
      cur.revenue += Number(o.total_pesewas);
      cur.orders += 1;
      eventTotals.set(key, cur);
    }
    const topEvents = Array.from(eventTotals.values())
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      summary: {
        grossPesewas,
        ordersCount,
        totalEvents: totalEvents ?? 0,
        ticketsIssued: ticketsIssued ?? 0,
      },
      series: days,
      topEvents,
      recentOrders: recent ?? [],
    };
  });
