import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, shouldRetryRead } from "@/api/client/http";
import { PatientForm, toDefaults } from "@/components/patients/PatientForm";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states/States";
import { getPatientRepository } from "@/repositories/patients";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/patients/$id/edit")({
  head: () => ({ meta: [
    { title: "Edit patient — Munab Staff" },
    { name: "description", content: "Update a patient's details." },
    { property: "og:title", content: "Edit patient — Munab Staff" },
    { property: "og:description", content: "Update patient details." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EditPatient,
});

function EditPatient() {
  const { id } = Route.useParams();
  const pid = Number(id);
  const { can, user, isDevSession } = useAuth();
  const repo = getPatientRepository(isDevSession);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const q = useQuery({ queryKey: ["patient", repo.source, pid], queryFn: () => repo.get(pid), retry: shouldRetryRead, enabled: can("edit_patients") });
  if (!can("edit_patients")) return <ForbiddenState />;
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const back = () => nav({ to: "/app/patients/$id", params: { id } });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {repo.source === "mock" && <MockDataBanner reason="Saved in this browser tab only" />}
      <h1 className="font-display text-2xl font-bold text-primary">Edit {q.data.full_name}</h1>
      <PatientForm
        initial={toDefaults(q.data)} branches={user?.branches ?? []} submitLabel="Save changes" serverErrors={errors} onCancel={back}
        onSubmit={async (input) => {
          setErrors(undefined);
          try {
            await repo.update(pid, input);
            await qc.invalidateQueries({ queryKey: ["patients"] });
            await qc.invalidateQueries({ queryKey: ["patient"] });
            toast.success("Patient details saved");
            back();
          } catch (e) {
            if (e instanceof ApiError && e.kind === "validation") setErrors(e.errors);
            else toast.error(e instanceof Error ? e.message : "Could not save changes");
          }
        }}
      />
    </div>
  );
}
