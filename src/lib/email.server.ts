// Server-only helpers. Never import from client-reachable code at module scope.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Sends a branded ticket confirmation email via Resend.
 * No-op (but logs) when RESEND_API_KEY is not configured — lets the app
 * function in dev/demo without keys; will activate as soon as the secret
 * is added.
 */
export async function sendTicketEmail(orderId: string): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, events(name, venue, starts_at, slug), tickets(id, ticket_code)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { sent: false, reason: "Order not found" };

  const event = order.events as { name: string; venue: string; starts_at: string; slug: string } | null;
  const tickets = (order.tickets ?? []) as Array<{ id: string; ticket_code: string }>;
  const baseUrl = process.env.APP_BASE_URL || "";

  const ticketLinks = tickets
    .map(
      (t) =>
        `<li style="margin:8px 0"><a href="${baseUrl}/ticket/${t.id}" style="color:#C9A84C;text-decoration:none">View ticket ${t.ticket_code}</a></li>`,
    )
    .join("");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0A0A0A;color:#FAFAF8;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:32px">
        <h1 style="font-family:Georgia,serif;color:#C9A84C;font-size:28px;margin:0 0 8px">TicketDesk</h1>
        <p style="margin:0 0 24px;color:#bbb">Your tickets are confirmed.</p>
        <h2 style="font-size:22px;margin:0 0 8px">${event?.name ?? "Your event"}</h2>
        <p style="margin:0 0 4px;color:#ddd">${event?.venue ?? ""}</p>
        <p style="margin:0 0 24px;color:#ddd">${event ? new Date(event.starts_at).toLocaleString("en-GH") : ""}</p>
        <p style="margin:0 0 8px"><strong>Order:</strong> ${order.reference}</p>
        <p style="margin:0 0 16px"><strong>Tickets (${tickets.length}):</strong></p>
        <ul style="padding-left:18px;margin:0 0 24px">${ticketLinks}</ul>
        <p style="color:#888;font-size:13px;margin:0">Show the QR code at the gate. Each ticket is single-use.</p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "TicketDesk <onboarding@resend.dev>",
      to: [order.buyer_email],
      subject: `Your tickets — ${event?.name ?? "TicketDesk"}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", text);
    return { sent: false, reason: "Resend API error" };
  }
  return { sent: true };
}
