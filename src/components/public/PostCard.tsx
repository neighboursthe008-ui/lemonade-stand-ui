import { Link } from "@tanstack/react-router";
import type { BlogPost } from "@/api/public/public.service";
import { formatDate } from "./PageHeader";

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <li className="group overflow-hidden rounded-lg border bg-card">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
        {post.featured_image
          ? <img src={post.featured_image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
          : <div className="aspect-[16/10] w-full bg-accent" aria-hidden />}
        <div className="p-5">
          {post.category && <p className="text-xs font-semibold uppercase tracking-wide text-aqua">{post.category}</p>}
          <h3 className="mt-1 font-semibold group-hover:underline">{post.title}</h3>
          {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
          {post.published_at && <p className="mt-3 text-xs text-muted-foreground">{formatDate(post.published_at)}</p>}
        </div>
      </Link>
    </li>
  );
}
