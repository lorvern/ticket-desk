import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminFindUserByEmail,
  adminGrantAdmin,
  adminListAdmins,
  adminRevokeAdmin,
  getMyRole,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, UserPlus, UserMinus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const qc = useQueryClient();
  const fetchRole = useServerFn(getMyRole);
  const fetchAdmins = useServerFn(adminListAdmins);
  const findUser = useServerFn(adminFindUserByEmail);
  const grant = useServerFn(adminGrantAdmin);
  const revoke = useServerFn(adminRevokeAdmin);

  const role = useQuery({ queryKey: ["me", "role"], queryFn: () => fetchRole() });
  const admins = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => fetchAdmins(),
    enabled: !!role.data?.isAdmin,
  });

  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<Awaited<ReturnType<typeof findUser>> | null>(null);

  const findMut = useMutation({
    mutationFn: (e: string) => findUser({ data: { email: e } }),
    onSuccess: (res) => {
      setLookup(res);
      if (!res.user) toast.error("No user found with that email.");
    },
    onError: (e: any) => toast.error(e.message ?? "Lookup failed"),
  });

  const grantMut = useMutation({
    mutationFn: (userId: string) => grant({ data: { userId } }),
    onSuccess: () => {
      toast.success("Admin access granted.");
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      if (lookup?.user) setLookup({ ...lookup, isAdmin: true, roles: [...lookup.roles, "admin"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to grant"),
  });

  const revokeMut = useMutation({
    mutationFn: (userId: string) => revoke({ data: { userId } }),
    onSuccess: (_d, userId) => {
      toast.success("Admin access revoked.");
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
      if (lookup?.user?.id === userId) {
        setLookup({ ...lookup, isAdmin: false, roles: lookup.roles.filter((r) => r !== "admin") });
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to revoke"),
  });

  if (role.isLoading) return <AdminShell title="Admins">Loading…</AdminShell>;
  if (!role.data?.isAdmin) {
    return (
      <AdminShell title="Not authorized">
        <p className="text-muted-foreground">Admin access required.</p>
      </AdminShell>
    );
  }

  const me = role.data.userId;
  const onlyAdminLeft = (admins.data?.count ?? 0) <= 1;

  return (
    <AdminShell title="Admins">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg">Current admins</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {admins.data?.count ?? 0} total
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {(admins.data?.admins ?? []).map((a) => {
              const isMe = a.user_id === me;
              return (
                <li key={a.user_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.email ?? <span className="text-muted-foreground">(no email)</span>}
                      {isMe && (
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          you
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {a.user_id}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={onlyAdminLeft || revokeMut.isPending}
                    onClick={() => {
                      if (isMe && !confirm("Revoke admin from yourself? You'll lose access immediately.")) return;
                      revokeMut.mutate(a.user_id);
                    }}
                    title={onlyAdminLeft ? "Cannot revoke the last admin" : "Revoke admin"}
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Revoke
                  </Button>
                </li>
              );
            })}
            {admins.isLoading && (
              <li className="py-6 text-center text-sm text-muted-foreground">Loading…</li>
            )}
            {admins.data?.admins.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">No admins.</li>
            )}
          </ul>
          {onlyAdminLeft && (
            <p className="mt-3 text-xs text-amber-600">
              Only one admin remains — grant admin to another user before revoking.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg">Grant admin</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            The user must already have a TicketDesk account (signed up at /auth).
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              findMut.mutate(email.trim());
            }}
          >
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={findMut.isPending}>
              {findMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find
            </Button>
          </form>

          {lookup?.user && (
            <div className="mt-4 rounded-md border border-border p-4">
              <p className="text-sm font-medium">{lookup.user.email}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{lookup.user.id}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Current roles: {lookup.roles.length ? lookup.roles.join(", ") : "none"}
              </p>
              <div className="mt-3 flex gap-2">
                {lookup.isAdmin ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={onlyAdminLeft || revokeMut.isPending}
                    onClick={() => revokeMut.mutate(lookup.user!.id)}
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Revoke admin
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={grantMut.isPending}
                    onClick={() => grantMut.mutate(lookup.user!.id)}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Grant admin
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
