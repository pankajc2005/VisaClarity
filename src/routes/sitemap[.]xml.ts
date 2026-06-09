import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { listSitemapPosts } from "@/lib/blog/blog.functions";

import { SITE_URL as BASE_URL } from "@/lib/core/platform";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { posts } = await listSitemapPosts();
        const entries: SitemapEntry[] = [
          { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
          { path: "/pricing", lastmod: today, changefreq: "monthly", priority: "0.7" },
          { path: "/roadmap", lastmod: today, changefreq: "weekly", priority: "0.9" },
          { path: "/blog", lastmod: today, changefreq: "weekly", priority: "0.8" },
          { path: "/about", lastmod: today, changefreq: "monthly", priority: "0.6" },
          ...posts.map((p: any) => ({
            path: `/blog/${p.slug}`,
            lastmod: (p.published_at ?? p.updated_at ?? "").slice(0, 10) || today,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
