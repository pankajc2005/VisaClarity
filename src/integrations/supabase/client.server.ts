// Server-side Supabase client with service role key - bypasses RLS.
// Use this for admin operations in server functions and server routes only.
// For user-authenticated queries (with RLS), use the auth middleware instead.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Stateful in-memory mock database for local dry-run / smoke testing
const mockQueueDb: any[] = [
  {
    id: "4a1e9c5f-4a0b-4dcd-9a8b-1e7d206f1234",
    topic: "student visa USA",
    primary_keyword: "student visa USA",
    secondary_keywords: ["F-1 visa requirements", "US student visa process"],
    status: "queued",
    priority: 5,
    llm_profile: "balanced",
    created_at: new Date().toISOString(),
  },
];

const mockPostsDb: any[] = [
  {
    id: "3d8e9c5f-4b0b-4dcd-9a8b-2e7d206f5678",
    slug: "test-article-for-local-run",
    title: "Test Article for Local Run",
    subtitle: "Auto-generated smoke test article",
    description: "This is a generated description for local testing.",
    category: "Guide",
    reading_minutes: 1,
    status: "in_review",
    qa_score: 95,
    qa_passed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    body_mdx:
      "## TL;DR\n\nThis article is a smoke-test generated locally. It contains facts about student visas USA [^1] and additional context [^2].",
    sources: [
      { index: 0, tier: "official", url: "https://travel.state.gov", title: "US Travel State Gov" },
      { index: 1, tier: "news", url: "https://uscis.gov", title: "USCIS" },
    ],
    author_id: "2c8e9c5f-4b0b-4dcd-9a8b-3e7d206f9012",
    generation_meta: {
      confidence: "high",
      needs_source_count: 0,
      voice_notes: "Matched a neutral, concise voice.",
    },
  },
];

const mockAuthorsDb: any[] = [
  {
    id: "2c8e9c5f-4b0b-4dcd-9a8b-3e7d206f9012",
    slug: "author-slug",
    name: "Mock Author",
    bio: "Bio",
    locale_hint: "US",
    voice_style: "Voice",
  },
];

const mockLogsDb: any[] = [
  {
    id: "1b8e9c5f-4b0b-4dcd-9a8b-4e7d206f1357",
    queue_id: "4a1e9c5f-4a0b-4dcd-9a8b-1e7d206f1234",
    post_id: "3d8e9c5f-4b0b-4dcd-9a8b-2e7d206f5678",
    step: "draft",
    ok: true,
    tool: "llm-chain",
    response_summary: "Generated article layout successfully",
    created_at: new Date().toISOString(),
  },
];

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function savePostPreviewFile(post: any) {
  if (post && post.body_mdx) {
    import("node:fs").then((fs) => {
      import("node:path").then((path) => {
        try {
          const previewContent = `# ${post.title}\n\n**Subtitle:** ${post.subtitle || ""}\n**Description:** ${post.description || ""}\n**Category:** ${post.category || ""}\n**Keywords:** ${post.keywords || ""}\n**QA Score:** ${post.qa_score ?? ""}\n\n---\n\n${post.body_mdx}`;
          fs.writeFileSync(
            path.join(process.cwd(), "last-post-preview.md"),
            previewContent,
            "utf8",
          );
          console.log("[Mock DB] Wrote last post preview to last-post-preview.md");
        } catch (err) {
          console.error("[Mock DB] Failed to write preview file:", err);
        }
      });
    });
  }
}

// Stateful mock query builder
class MockQuery {
  table: string;
  _filters: Array<{ type: "eq" | "in" | "gte"; col: string; val: any }> = [];
  _order: { col: string; ascending: boolean } | null = null;
  _limit: number | null = null;
  _countOnly: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(s?: any, opts?: any) {
    if (opts?.count) {
      this._countOnly = true;
    }
    return this;
  }

  insert(p: any) {
    const list = this.getTableList();
    const rows = Array.isArray(p) ? p : [p];
    const inserted = rows.map((r) => {
      const newRow = {
        id: r.id || uuid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...r,
      };
      list.push(newRow);
      return newRow;
    });

    if (this.table === "blog_posts") {
      savePostPreviewFile(inserted[0]);
    }

    return Promise.resolve({ data: Array.isArray(p) ? inserted : inserted[0], error: null }) as any;
  }

  update(p: any) {
    const list = this.getTableList();
    const matches = this.getFilteredList(list);
    matches.forEach((item) => {
      Object.assign(item, {
        ...p,
        updated_at: new Date().toISOString(),
      });
    });
    return Promise.resolve({ data: matches, error: null }) as any;
  }

  delete() {
    const list = this.getTableList();
    const matches = this.getFilteredList(list);
    const matchIds = new Set(matches.map((m) => m.id));

    let i = list.length;
    while (i--) {
      if (matchIds.has(list[i].id)) {
        list.splice(i, 1);
      }
    }
    return Promise.resolve({ data: matches, error: null }) as any;
  }

  eq(col: string, val: any) {
    this._filters.push({ type: "eq", col, val });
    return this;
  }

  gte(col: string, val: any) {
    this._filters.push({ type: "gte", col, val });
    return this;
  }

  in(col: string, val: any) {
    this._filters.push({ type: "in", col, val });
    return this;
  }

  order(col: string, opts?: { ascending: boolean }) {
    this._order = { col, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  maybeSingle() {
    return this.then((res: any) => ({
      data: res.data && res.data.length > 0 ? res.data[0] : null,
      error: res.error,
    }));
  }

  single() {
    return this.then((res: any) => {
      if (!res.data || res.data.length === 0) {
        return { data: null, error: new Error("No rows found") as any };
      }
      return { data: res.data[0], error: null };
    });
  }

  private getTableList(): any[] {
    if (this.table === "blog_topic_queue") return mockQueueDb;
    if (this.table === "blog_posts") return mockPostsDb;
    if (this.table === "blog_authors") return mockAuthorsDb;
    if (this.table === "blog_generation_logs") return mockLogsDb;
    return [];
  }

  private getFilteredList(rawList: any[]): any[] {
    let list = [...rawList];

    for (const f of this._filters) {
      if (f.type === "eq") {
        list = list.filter((item) => {
          const itemVal = item[f.col];
          if (itemVal === undefined) return false;
          if (typeof itemVal === "string" && typeof f.val === "string") {
            return itemVal.toLowerCase() === f.val.toLowerCase();
          }
          return itemVal === f.val;
        });
      } else if (f.type === "gte") {
        list = list.filter((item) => item[f.col] >= f.val);
      } else if (f.type === "in") {
        const set = new Set(Array.isArray(f.val) ? f.val : [f.val]);
        list = list.filter((item) => set.has(item[f.col]));
      }
    }

    if (this._order) {
      const { col, ascending } = this._order;
      list.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    if (this._limit !== null) {
      list = list.slice(0, this._limit);
    }

    return list;
  }

  then(onfulfilled: any) {
    const list = this.getTableList();
    const data = this.getFilteredList(list);

    if (this._countOnly) {
      return Promise.resolve({ count: data.length, error: null }).then(onfulfilled);
    }

    return Promise.resolve({ data, error: null }).then(onfulfilled);
  }
}

const mockSupabaseAdmin = {
  from(table: string) {
    return new MockQuery(table);
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, body: any, options: any) {
          console.log(`[Mock Storage] Uploaded to ${bucket}/${path}`);
          return { data: { path }, error: null };
        },
        async createSignedUrl(path: string, expiresInSeconds: number) {
          console.log(`[Mock Storage] Created signed URL for ${bucket}/${path}`);
          const signedUrl = path.endsWith(".txt")
            ? "data:text/plain;base64,cG9ydGFiaWxpdHktY2hlY2s="
            : `https://mock-supabase-storage.local/${bucket}/${path}?token=mock`;
          return {
            data: { signedUrl },
            error: null,
          };
        },
      };
    },
  },
};

function createSupabaseAdminClient() {
  if (process.env.BLOG_AGENT_LOCAL_TEST === "1") {
    return mockSupabaseAdmin as any;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_SERVICE_ROLE_KEY ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Please check your .env file or local environment configuration.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
