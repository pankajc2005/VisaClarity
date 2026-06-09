/**
 * Storage helpers for blog images. Uses supabaseAdmin (server-only).
 */

export async function uploadBlogImage(
  path: string,
  bytes: Uint8Array,
  contentType = "image/png",
): Promise<string | null> {
  if (process.env.BLOG_AGENT_LOCAL_TEST === "1") {
    return "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80";
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.storage.from("blog-images").upload(path, bytes, {
    contentType,
    upsert: true,
    cacheControl: "31536000, immutable",
  });
  if (error) {
    console.error("[blog/storage] upload failed", error);
    return null;
  }
  const { data } = supabaseAdmin.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl ?? null;
}
