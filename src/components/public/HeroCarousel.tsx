import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import reception from "@/assets/munab-reception.jpg";
import ward from "@/assets/munab-ward.jpg";
import diagnostics from "@/assets/munab-diagnostics.jpg";

const slides = [
  { src: reception, alt: "Patients and clinicians in a modern hospital reception" },
  { src: ward, alt: "A nurse caring for a patient in a bright inpatient ward" },
  { src: diagnostics, alt: "Hospital clinicians reviewing diagnostic imaging" },
];
const INTERVAL_MS = 45_000;

export function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [i]);
  const go = (d: number) => setI((n) => (n + d + slides.length) % slides.length);

  return (
    <div className="absolute inset-0" aria-roledescription="carousel" aria-label="Munab hospital departments">
      {slides.map((s, idx) => (
        <img
          key={s.src} src={s.src} alt={s.alt} aria-hidden={idx !== i}
          loading={idx === 0 ? "eager" : "lazy"} width={1600} height={1000}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1500ms] ease-out motion-reduce:transition-none ${idx === i ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/90 via-brand/60 to-brand/10" />
      <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2">
        <button aria-label="Previous photo" onClick={() => go(-1)} className="rounded-full bg-brand/60 p-2 text-brand-foreground hover:bg-brand/80"><ChevronLeft className="h-4 w-4" /></button>
        {slides.map((_, idx) => (
          <button key={idx} aria-label={`Show photo ${idx + 1}`} aria-current={idx === i}
            onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-lemon" : "w-2 bg-brand-foreground/60"}`} />
        ))}
        <button aria-label="Next photo" onClick={() => go(1)} className="rounded-full bg-brand/60 p-2 text-brand-foreground hover:bg-brand/80"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
