import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/EventForm";
import { adminUpsertEvent } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/events/new")({
  component: NewEvent,
});

function NewEvent() {
  const upsert = useServerFn(adminUpsertEvent);
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: (res: any) => {
      toast.success("Event created");
      navigate({ to: "/admin/events/$id", params: { id: res.event.id } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  return (
    <AdminShell title="New event">
      <EventForm onSubmit={(v) => m.mutate(v)} submitting={m.isPending} />
    </AdminShell>
  );
}
