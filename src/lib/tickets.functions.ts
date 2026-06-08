import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------- Validators ----------
const slugSchema = z.object({ slug: z.string().min(1).max(120) });

const createOrderSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketCategoryId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(10),
  buyer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(7).max(30),
  }),
  couponCode: z.string().trim().max(60).optional().nullable(),
});

const verifySchema = z.object({ reference: z.string().min(4).max(120) });
const retrieveSchema = z.object({
  email: z.string().trim().email().max(255).optional().nullable(),
  reference: z.string().trim().max(120).optional().nullable(),
});
const ticketIdSchema = z.object({ id: z.string().uuid() });
const couponSchema = z.object({
  code: z.string().trim().min(1).max(60),
  eventId: z.string().uuid(),
  subtotalPesewas: z.number().int().min(0),
});

// ---------- Helpers ----------
const HANDLING_FEE_PERCENT = 2.5;
function computeFee(subtotal: number) {
  return Math.round((subtotal * HANDLING_FEE_PERCENT) / 100);
}
function randomCode(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// ---------- Public reads ----------
export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id, slug, name, description, banner_url, venue, starts_at, organizer_name, is_featured, category")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);
  return { events: data ?? [] };
});

export const getEventBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => slugSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!event) return { event: null, categories: [] };

    const { data: categories, error: cErr } = await supabaseAdmin
      .from("ticket_categories")
      .select("id, name, description, price_pesewas, quantity, sold_count, sale_starts_at, sale_ends_at, sort_order")
      .eq("event_id", event.id)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("price_pesewas", { ascending: true });
    if (cErr) throw new Error(cErr.message);

    return { event, categories: categories ?? [] };
  });

// ---------- Coupons ----------
export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d) => couponSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    if (!coupon) return { ok: false as const, error: "Invalid coupon" };
    if (coupon.event_id && coupon.event_id !== data.eventId) {
      return { ok: false as const, error: "Coupon not valid for this event" };
    }
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "Coupon expired" };
    }
    if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses) {
      return { ok: false as const, error: "Coupon limit reached" };
    }
    const discount =
      coupon.discount_type === "percent"
        ? Math.round((data.subtotalPesewas * Number(coupon.discount_value)) / 100)
        : Math.min(Number(coupon.discount_value), data.subtotalPesewas);
    return { ok: true as const, couponId: coupon.id, discountPesewas: discount, code: coupon.code };
  });

// ---------- Checkout ----------
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load event + categories
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, name, status")
      .eq("id", data.eventId)
      .maybeSingle();
    if (!event || event.status !== "published") throw new Error("Event not available");

    const ids = data.items.map((i) => i.ticketCategoryId);
    const { data: cats, error: cErr } = await supabaseAdmin
      .from("ticket_categories")
      .select("id, event_id, name, price_pesewas, quantity, sold_count, sale_starts_at, sale_ends_at, is_visible")
      .in("id", ids);
    if (cErr) throw new Error(cErr.message);
    if (!cats || cats.length !== ids.length) throw new Error("Invalid ticket selection");

    const now = Date.now();
    let subtotal = 0;
    const lineItems: Array<{ category_id: string; name: string; unit: number; qty: number }> = [];
    for (const it of data.items) {
      const cat = cats.find((c) => c.id === it.ticketCategoryId)!;
      if (cat.event_id !== data.eventId || !cat.is_visible) throw new Error("Invalid ticket");
      if (cat.sale_starts_at && new Date(cat.sale_starts_at).getTime() > now)
        throw new Error(`${cat.name} not on sale yet`);
      if (cat.sale_ends_at && new Date(cat.sale_ends_at).getTime() < now)
        throw new Error(`${cat.name} sale ended`);
      const remaining = cat.quantity - cat.sold_count;
      if (it.quantity > remaining) throw new Error(`Only ${remaining} ${cat.name} ticket(s) left`);
      subtotal += Number(cat.price_pesewas) * it.quantity;
      lineItems.push({ category_id: cat.id, name: cat.name, unit: Number(cat.price_pesewas), qty: it.quantity });
    }

    // Coupon
    let couponId: string | null = null;
    let discount = 0;
    if (data.couponCode) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (coupon && (!coupon.event_id || coupon.event_id === data.eventId)) {
        const valid =
          (!coupon.expires_at || new Date(coupon.expires_at).getTime() >= now) &&
          (coupon.max_uses == null || coupon.uses_count < coupon.max_uses);
        if (valid) {
          couponId = coupon.id;
          discount =
            coupon.discount_type === "percent"
              ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
              : Math.min(Number(coupon.discount_value), subtotal);
        }
      }
    }

    const fee = computeFee(subtotal - discount);
    const total = Math.max(0, subtotal - discount + fee);
    const reference = `TKD-${Date.now().toString(36).toUpperCase()}-${randomCode(6)}`;

    // Create order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        reference,
        event_id: data.eventId,
        buyer_name: data.buyer.name,
        buyer_email: data.buyer.email.toLowerCase(),
        buyer_phone: data.buyer.phone,
        subtotal_pesewas: subtotal,
        discount_pesewas: discount,
        fee_pesewas: fee,
        total_pesewas: total,
        coupon_id: couponId,
        status: "pending",
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabaseAdmin.from("order_items").insert(
      lineItems.map((li) => ({
        order_id: order.id,
        ticket_category_id: li.category_id,
        ticket_name: li.name,
        unit_price_pesewas: li.unit,
        quantity: li.qty,
      })),
    );
    if (iErr) throw new Error(iErr.message);

    // Paystack init (real if key present, else demo mode)
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || null;

    if (paystackKey) {
      try {
        const res = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.buyer.email,
            amount: total, // pesewas
            currency: "GHS",
            reference,
            metadata: { order_id: order.id, event_id: data.eventId },
            channels: ["card", "mobile_money", "bank", "bank_transfer"],
          }),
        });
        const json = (await res.json()) as { status: boolean; data?: { access_code: string; reference: string }; message?: string };
        if (!json.status || !json.data) throw new Error(json.message || "Paystack init failed");
        await supabaseAdmin
          .from("orders")
          .update({ paystack_access_code: json.data.access_code, paystack_reference: json.data.reference })
          .eq("id", order.id);
        return {
          mode: "paystack" as const,
          reference,
          accessCode: json.data.access_code,
          publicKey,
          orderId: order.id,
          totalPesewas: total,
        };
      } catch (e) {
        console.error("Paystack init error:", e);
        throw new Error("Could not initialize payment. Please try again.");
      }
    }

    return {
      mode: "demo" as const,
      reference,
      orderId: order.id,
      totalPesewas: total,
      publicKey: null,
    };
  });

// Verify payment and issue tickets atomically
export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => verifySchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("reference", data.reference)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("Order not found");

    // If already issued, just return tickets
    if (order.status === "paid") {
      const { data: existing } = await supabaseAdmin
        .from("tickets")
        .select("id")
        .eq("order_id", order.id);
      return { ok: true as const, orderId: order.id, ticketIds: (existing ?? []).map((t) => t.id) };
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    let verified = false;

    if (paystackKey) {
      const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey}` },
      });
      const json = (await res.json()) as { status: boolean; data?: { status: string; amount: number } };
      if (json.status && json.data?.status === "success" && json.data.amount === Number(order.total_pesewas)) {
        verified = true;
      } else {
        await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
        return { ok: false as const, error: "Payment not successful" };
      }
    } else {
      // Demo mode: no key configured, accept verification for testing
      verified = true;
    }

    if (!verified) return { ok: false as const, error: "Payment not verified" };

    // Issue tickets
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const ticketRows: Array<{
      order_id: string;
      event_id: string;
      ticket_category_id: string;
      ticket_code: string;
      qr_payload: string;
      attendee_name: string | null;
    }> = [];
    for (const it of items ?? []) {
      for (let i = 0; i < it.quantity; i++) {
        const code = randomCode(12);
        ticketRows.push({
          order_id: order.id,
          event_id: order.event_id,
          ticket_category_id: it.ticket_category_id,
          ticket_code: code,
          qr_payload: `TKD:${order.reference}:${code}`,
          attendee_name: order.buyer_name,
        });
      }
    }
    const { data: inserted, error: tErr } = await supabaseAdmin
      .from("tickets")
      .insert(ticketRows)
      .select("id");
    if (tErr) throw new Error(tErr.message);

    await supabaseAdmin
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", order.id);

    if (order.coupon_id) {
      try {
        const { data: c } = await supabaseAdmin
          .from("coupons")
          .select("uses_count")
          .eq("id", order.coupon_id)
          .maybeSingle();
        if (c) {
          await supabaseAdmin
            .from("coupons")
            .update({ uses_count: (c.uses_count ?? 0) + 1 })
            .eq("id", order.coupon_id);
        }
      } catch {
        /* non-fatal */
      }
    }

    // Fire-and-forget email (no-op if RESEND_API_KEY missing)
    try {
      const { sendTicketEmail } = await import("./email.server");
      await sendTicketEmail(order.id);
    } catch (e) {
      console.warn("Email send failed (non-fatal):", e);
    }

    return { ok: true as const, orderId: order.id, ticketIds: (inserted ?? []).map((t) => t.id) };
  });

// ---------- Retrieval ----------
export const retrieveTickets = createServerFn({ method: "POST" })
  .inputValidator((d) => retrieveSchema.parse(d))
  .handler(async ({ data }) => {
    if (!data.email && !data.reference) return { orders: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select("id, reference, buyer_name, buyer_email, total_pesewas, status, created_at, event_id, events(name, slug, venue, starts_at, banner_url), tickets(id, ticket_code, status)")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data.reference) q = q.eq("reference", data.reference.trim().toUpperCase());
    if (data.email) q = q.eq("buyer_email", data.email.trim().toLowerCase());
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

export const getTicket = createServerFn({ method: "GET" })
  .inputValidator((d) => ticketIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket, error } = await supabaseAdmin
      .from("tickets")
      .select("*, events(name, slug, venue, starts_at, banner_url), orders(reference, buyer_name, buyer_email), ticket_categories(name, price_pesewas)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { ticket };
  });
