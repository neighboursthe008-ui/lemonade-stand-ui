import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { NotFoundState } from "@/components/states/States";
import { ResourcePage } from "@/modules/components/ResourcePage";
import { moduleByKey } from "@/modules/registry";

interface Search { new?: 1; patient_id?: number }

export const Route = createFileRoute("/app/$module")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(s["new"] ? { new: 1 as const } : {}),
    ...(s["patient_id"] != null && isFinite(Number(s["patient_id"])) ? { patient_id: Number(s["patient_id"]) } : {}),
  }),
  head: ({ params }) => {
    const m = moduleByKey(params.module);
    const title = `${m?.title ?? "Not found"} — Lemonade Staff`;
    return { meta: [
      { title }, { name: "description", content: m?.description ?? "Page not found" },
      { property: "og:title", content: title }, { property: "og:description", content: m?.description ?? "" },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: ModulePage,
});

function ModulePage() {
  const { module } = Route.useParams();
  const search = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });
  const cfg = moduleByKey(module);
  const clear = useCallback(() => nav({ search: {}, replace: true }), [nav]);
  if (!cfg) return <NotFoundState what="page" />;
  return <ResourcePage cfg={cfg} openCreate={search.new === 1} {...(search.patient_id != null ? { presetPatientId: search.patient_id } : {})} onCreateHandled={clear} />;
}
