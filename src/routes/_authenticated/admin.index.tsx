import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminAnalytics, getMyRole } from "@/lib/admin.functions";
import { formatGhs } from "@/lib/format";
import { CalendarDays, ShoppingBag, TicketIcon, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-gold">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

function AdminDashboard() {
  const fetchRole = useServerFn(getMyRole);
  const fetchAnalytics = useServerFn(adminAnalytics);
  const role = useQuery({ queryKey: ["me", "role"], queryFn: () => fetchRole() });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fetchAnalytics(),
    enabled: !!role.data?.isAdmin,
  });

  if (role.isLoading) return <AdminShell title="Dashboard">Loading…</AdminShell>;
  if (!role.data?.isAdmin) {
    return (
      <AdminShell title="Not authorized">
        <p className="text-muted-foreground">
          Your account doesn't have admin access. Ask an existing admin to grant you a role.
        </p>
      </AdminShell>
    );
  }

  const max = Math.max(1, ...(data?.series ?? []).map((d) => d.revenue));

  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross revenue" value={isLoading ? "…" : formatGhs(data!.summary.grossPesewas)} icon={TrendingUp} />
        <StatCard label="Paid orders" value={isLoading ? "…" : String(data!.summary.ordersCount)} icon={ShoppingBag} />
        <StatCard label="Tickets issued" value={isLoading ? "…" : String(data!.summary.ticketsIssued)} icon={TicketIcon} />
        <StatCard label="Events" value={isLoading ? "…" : String(data!.summary.totalEvents)} icon={CalendarDays} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Last 14 days · Revenue</p>
          <div className="mt-6 flex h-48 items-end gap-1.5">
            {(data?.series ?? []).map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-ink to-gold transition-opacity hover:opacity-90"
                  style={{ height: `${(d.revenue / max) * 100}%`, minHeight: 2 }}
                  title={`${d.date}: ${formatGhs(d.revenue)}`}
                />
                <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Top events</p>
          <ul className="mt-4 space-y-3">
            {(data?.topEvents ?? []).map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm">{e.name}</span>
                <span className="text-sm font-semibold">{formatGhs(e.revenue)}</span>
              </li>
            ))}
            {(data?.topEvents.length ?? 0) === 0 && (
              <li className="text-sm text-muted-foreground">No paid orders yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent orders</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">Reference</th><th>Buyer</th><th>Event</th><th>Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {(data?.recentOrders ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2 font-mono text-xs">{o.reference}</td>
                  <td>{o.buyer_name}</td>
                  <td className="text-muted-foreground">{o.events?.name}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      o.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                      o.status === "pending" ? "bg-amber-100 text-amber-800" :
                      "bg-muted text-muted-foreground"
                    }`}>{o.status}</span>
                  </td>
                  <td className="text-right font-semibold">{formatGhs(o.total_pesewas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
