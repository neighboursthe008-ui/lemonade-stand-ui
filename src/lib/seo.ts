export const seo = (title: string, description: string, extra: { name?: string; property?: string; content: string }[] = []) => ({
  meta: [
    { title: `${title} — Lemonade Dental Clinic` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Lemonade Dental Clinic` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    ...extra,
  ],
});
