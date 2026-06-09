import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListOrders } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { formatGHS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersPage,
});

const STATUSES = ["all", "paid", "pending", "failed", "refunded"] as const;

function OrdersPage() {
  const fetchFn = useServerFn(adminListOrders);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", status],
    queryFn: () => fetchFn({ data: { status } }),
  });

  return (
    <AdminShell title="Orders">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-wider ${
              status === s ? "border-ink bg-ink text-ink-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}>{s}</button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Tickets</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data?.orders ?? []).map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{o.reference}</td>
                <td className="px-4 py-3">
                  <div>{o.buyer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.buyer_email}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.events?.name}</td>
                <td className="px-4 py-3">{o.tickets?.length ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    o.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                    o.status === "pending" ? "bg-amber-100 text-amber-800" :
                    o.status === "failed" ? "bg-rose-100 text-rose-800" :
                    "bg-muted text-muted-foreground"
                  }`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold">{formatGHS(o.total_pesewas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="p-6 text-center text-muted-foreground">Loading…</p>}
        {!isLoading && (data?.orders?.length ?? 0) === 0 && (
          <p className="p-12 text-center text-muted-foreground">No orders found.</p>
        )}
      </Card>
    </AdminShell>
  );
}
