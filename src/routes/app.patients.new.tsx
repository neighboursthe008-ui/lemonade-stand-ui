import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client/http";
import { PatientForm, toDefaults } from "@/components/patients/PatientForm";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { ForbiddenState } from "@/components/states/States";
import { getPatientRepository } from "@/repositories/patients";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/patients/new")({
  head: () => ({ meta: [
    { title: "Register patient — Munab Staff" },
    { name: "description", content: "Register a new patient at the clinic." },
    { property: "og:title", content: "Register patient — Munab Staff" },
    { property: "og:description", content: "New patient registration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: NewPatient,
});

function NewPatient() {
  const { can, user, isDevSession, activeBranchId } = useAuth();
  const repo = getPatientRepository(isDevSession);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string[]>>();
  if (!can("create_patients")) return <ForbiddenState />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {repo.source === "mock" && <MockDataBanner reason="Saved in this browser tab only" />}
      <h1 className="font-display text-2xl font-bold text-primary">Register patient</h1>
      <PatientForm
        initial={toDefaults(undefined, activeBranchId)} branches={user?.branches ?? []} submitLabel="Register patient" serverErrors={errors}
        onCancel={() => nav({ to: "/app/patients" })}
        onSubmit={async (input) => {
          setErrors(undefined);
          try {
            const p = await repo.create(input);
            await qc.invalidateQueries({ queryKey: ["patients"] });
            toast.success(`${p.full_name} registered as ${p.patient_number}`);
            nav({ to: "/app/patients/$id", params: { id: String(p.id) } });
          } catch (e) {
            if (e instanceof ApiError && e.kind === "validation") setErrors(e.errors);
            else toast.error(e instanceof Error ? e.message : "Could not register patient");
          }
        }}
      />
    </div>
  );
}
