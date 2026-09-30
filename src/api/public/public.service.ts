import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";

/**
 * Shapes verified against the Laravel source (DentalController, openapi BlogPost).
 * NOTE: /api/dental/services and /api/dental/doctors currently return fixed lists from the
 * controller (not database rows) — the UI shows whatever the server returns.
 */
export interface DentalService { id: number; name: string }
export interface Doctor { id: number; name: string; specialty?: string | null }
export interface BlogPost {
  id: number; title: string; slug: string; category?: string | null; excerpt?: string | null;
  featured_image?: string | null; published_at?: string | null; meta_title?: string | null;
  meta_description?: string | null; views?: number; content?: string | null; body?: string | null;
}
export interface Testimonial { id?: number; name?: string; author?: string; content?: string; message?: string; rating?: number }
export interface GalleryItem { id?: number; title?: string | null; image?: string | null; image_url?: string | null; url?: string | null }
export interface FeaturedContent {
  articles: BlogPost[]; news: BlogPost[]; events: BlogPost[]; testimonials: Testimonial[]; gallery: GalleryItem[]; campaign: unknown;
}

const list = <T,>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : []);

export const publicService = {
  services: async () => list<DentalService>((await request<unknown>(endpoints.public.services, { auth: false })).data),
  doctors: async () => list<Doctor>((await request<unknown>(endpoints.public.doctors, { auth: false })).data),
  /** Controller reads `date` and `doctor` query params (openapi lists doctor_id — code is authoritative). */
  availableTimes: async (doctor: number, date: string) =>
    list<string>((await request<unknown>(endpoints.public.availableTimes, { auth: false, query: { doctor, date } })).data),
  featured: async () => {
    const d = (await request<Partial<FeaturedContent>>(endpoints.public.featuredContent, { auth: false })).data ?? {};
    return { articles: d.articles ?? [], news: d.news ?? [], events: d.events ?? [], testimonials: d.testimonials ?? [], gallery: d.gallery ?? [], campaign: d.campaign ?? null } as FeaturedContent;
  },
  blogPosts: (page = 1, search?: string) =>
    request<BlogPost[]>(endpoints.public.blogPosts, { auth: false, query: { page, per_page: 9, search } }),
  blogPost: async (slug: string) => (await request<BlogPost>(endpoints.public.blogPost(slug), { auth: false })).data,
  events: async () => list<BlogPost>((await request<unknown>(endpoints.public.events, { auth: false })).data),
  campaigns: async () => list<Record<string, unknown>>((await request<unknown>(endpoints.public.campaigns, { auth: false })).data),
};

export const publicKeys = {
  services: ["public", "services"] as const,
  doctors: ["public", "doctors"] as const,
  featured: ["public", "featured"] as const,
  events: ["public", "events"] as const,
  blog: (page: number, q: string) => ["public", "blog", page, q] as const,
  post: (slug: string) => ["public", "post", slug] as const,
  times: (doctor: number, date: string) => ["public", "times", doctor, date] as const,
};
