import { FlaskConical } from "lucide-react";
import { SHOW_MOCK_INDICATORS } from "@/config/env";

/** Subtle indicator that a screen shows development data, not Laravel records. */
export function MockDataBanner({ reason }: { reason?: string }) {
  if (!SHOW_MOCK_INDICATORS) return null;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-warning/60 bg-warning/10 px-2.5 py-1 text-xs text-foreground/80">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden />
      <span className="font-medium">Development data</span>
      {reason && <span className="text-muted-foreground">· {reason}</span>}
    </div>
  );
}
