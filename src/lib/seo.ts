export const seo = (title: string, description: string, extra: { name?: string; property?: string; content: string }[] = []) => ({
  meta: [
    { title: `${title} — Munab Nursing Home` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Munab Nursing Home` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    ...extra,
  ],
});
