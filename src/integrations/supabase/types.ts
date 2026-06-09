export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      blog_authors: {
        Row: {
          avatar_url: string | null;
          bio: string;
          created_at: string;
          expertise: string[];
          id: string;
          locale_hint: string | null;
          name: string;
          slug: string;
          updated_at: string;
          voice_style: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string;
          created_at?: string;
          expertise?: string[];
          id?: string;
          locale_hint?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
          voice_style?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string;
          created_at?: string;
          expertise?: string[];
          id?: string;
          locale_hint?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
          voice_style?: string;
        };
        Relationships: [];
      };
      blog_generation_logs: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          ok: boolean;
          post_id: string | null;
          queue_id: string | null;
          request: Json | null;
          response_summary: string | null;
          step: Database["public"]["Enums"]["blog_gen_step"];
          tool: string | null;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          ok?: boolean;
          post_id?: string | null;
          queue_id?: string | null;
          request?: Json | null;
          response_summary?: string | null;
          step: Database["public"]["Enums"]["blog_gen_step"];
          tool?: string | null;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          ok?: boolean;
          post_id?: string | null;
          queue_id?: string | null;
          request?: Json | null;
          response_summary?: string | null;
          step?: Database["public"]["Enums"]["blog_gen_step"];
          tool?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_generation_logs_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_generation_logs_queue_id_fkey";
            columns: ["queue_id"];
            isOneToOne: false;
            referencedRelation: "blog_topic_queue";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          author_id: string | null;
          body_mdx: string;
          category: string;
          created_at: string;
          description: string;
          generation_meta: Json;
          hero_image_alt: string | null;
          hero_image_url: string | null;
          hero_prompt: string | null;
          id: string;
          keywords: string;
          published_at: string | null;
          reading_minutes: number;
          slug: string;
          sources: Json;
          status: Database["public"]["Enums"]["blog_post_status"];
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body_mdx?: string;
          category?: string;
          created_at?: string;
          description?: string;
          generation_meta?: Json;
          hero_image_alt?: string | null;
          hero_image_url?: string | null;
          hero_prompt?: string | null;
          id?: string;
          keywords?: string;
          published_at?: string | null;
          reading_minutes?: number;
          slug: string;
          sources?: Json;
          status?: Database["public"]["Enums"]["blog_post_status"];
          subtitle?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body_mdx?: string;
          category?: string;
          created_at?: string;
          description?: string;
          generation_meta?: Json;
          hero_image_alt?: string | null;
          hero_image_url?: string | null;
          hero_prompt?: string | null;
          id?: string;
          keywords?: string;
          published_at?: string | null;
          reading_minutes?: number;
          slug?: string;
          sources?: Json;
          status?: Database["public"]["Enums"]["blog_post_status"];
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "blog_authors";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_topic_queue: {
        Row: {
          angle: string | null;
          audience: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error: string | null;
          id: string;
          post_id: string | null;
          primary_keyword: string;
          priority: number;
          secondary_keywords: string[];
          started_at: string | null;
          status: Database["public"]["Enums"]["blog_queue_status"];
          topic: string;
          updated_at: string;
        };
        Insert: {
          angle?: string | null;
          audience?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          post_id?: string | null;
          primary_keyword: string;
          priority?: number;
          secondary_keywords?: string[];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["blog_queue_status"];
          topic: string;
          updated_at?: string;
        };
        Update: {
          angle?: string | null;
          audience?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          post_id?: string | null;
          primary_keyword?: string;
          priority?: number;
          secondary_keywords?: string[];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["blog_queue_status"];
          topic?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_topic_queue_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      error_reports: {
        Row: {
          context: Json | null;
          created_at: string;
          id: string;
          message: string | null;
          stack: string | null;
          url: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_note: string | null;
        };
        Insert: {
          context?: Json | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          stack?: string | null;
          url?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_note?: string | null;
        };
        Update: {
          context?: Json | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          stack?: string | null;
          url?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_note?: string | null;
        };
        Relationships: [];
      };
      idempotency_keys: {
        Row: {
          created_at: string;
          expires_at: string;
          key: string;
          request_hash: string | null;
          response: Json | null;
          scope: string;
          status: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          key: string;
          request_hash?: string | null;
          response?: Json | null;
          scope: string;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          key?: string;
          request_hash?: string | null;
          response?: Json | null;
          scope?: string;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          created_at: string;
          destination: string;
          email: string;
          id: string;
          nationality: string;
          purpose: string;
        };
        Insert: {
          created_at?: string;
          destination: string;
          email: string;
          id?: string;
          nationality: string;
          purpose: string;
        };
        Update: {
          created_at?: string;
          destination?: string;
          email?: string;
          id?: string;
          nationality?: string;
          purpose?: string;
        };
        Relationships: [];
      };
      personalized_requests: {
        Row: {
          created_at: string;
          deliverable: Json | null;
          destination: string;
          id: string;
          kind: Database["public"]["Enums"]["personalized_request_kind"];
          nationality: string;
          notes: string | null;
          notified_at: string | null;
          notify_email: string;
          purpose: string;
          status: Database["public"]["Enums"]["personalized_request_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deliverable?: Json | null;
          destination: string;
          id?: string;
          kind: Database["public"]["Enums"]["personalized_request_kind"];
          nationality: string;
          notes?: string | null;
          notified_at?: string | null;
          notify_email: string;
          purpose: string;
          status?: Database["public"]["Enums"]["personalized_request_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deliverable?: Json | null;
          destination?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["personalized_request_kind"];
          nationality?: string;
          notes?: string | null;
          notified_at?: string | null;
          notify_email?: string;
          purpose?: string;
          status?: Database["public"]["Enums"]["personalized_request_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      personalized_roadmap_requests: {
        Row: {
          attempts: number;
          created_at: string;
          destination: string;
          docx_path: string | null;
          error_message: string | null;
          eta_minutes: number;
          id: string;
          idempotency_key: string | null;
          nationality: string;
          notified_at: string | null;
          notify_email: string;
          pdf_path: string | null;
          profile: Json;
          purpose: string;
          ready_at: string | null;
          result: Json | null;
          started_at: string | null;
          status: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          destination: string;
          docx_path?: string | null;
          error_message?: string | null;
          eta_minutes?: number;
          id?: string;
          idempotency_key?: string | null;
          nationality: string;
          notified_at?: string | null;
          notify_email: string;
          pdf_path?: string | null;
          profile?: Json;
          purpose: string;
          ready_at?: string | null;
          result?: Json | null;
          started_at?: string | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          destination?: string;
          docx_path?: string | null;
          error_message?: string | null;
          eta_minutes?: number;
          id?: string;
          idempotency_key?: string | null;
          nationality?: string;
          notified_at?: string | null;
          notify_email?: string;
          pdf_path?: string | null;
          profile?: Json;
          purpose?: string;
          ready_at?: string | null;
          result?: Json | null;
          started_at?: string | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      roadmap_cache: {
        Row: {
          cache_key: string;
          created_at: string;
          destination: string;
          expires_at: string;
          id: string;
          nationality: string;
          purpose: string;
          roadmap: Json;
          share_slug: string;
        };
        Insert: {
          cache_key: string;
          created_at?: string;
          destination: string;
          expires_at?: string;
          id?: string;
          nationality: string;
          purpose: string;
          roadmap: Json;
          share_slug: string;
        };
        Update: {
          cache_key?: string;
          created_at?: string;
          destination?: string;
          expires_at?: string;
          id?: string;
          nationality?: string;
          purpose?: string;
          roadmap?: Json;
          share_slug?: string;
        };
        Relationships: [];
      };
      roadmap_usage: {
        Row: {
          count: number;
          created_at: string;
          fingerprint: string;
          id: string;
          ip_hash: string;
          last_email: string | null;
          month: string;
          updated_at: string;
        };
        Insert: {
          count?: number;
          created_at?: string;
          fingerprint: string;
          id?: string;
          ip_hash: string;
          last_email?: string | null;
          month: string;
          updated_at?: string;
        };
        Update: {
          count?: number;
          created_at?: string;
          fingerprint?: string;
          id?: string;
          ip_hash?: string;
          last_email?: string | null;
          month?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      saga_steps: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          payload: Json | null;
          saga_id: string;
          status: string;
          step_name: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          payload?: Json | null;
          saga_id: string;
          status: string;
          step_name: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          payload?: Json | null;
          saga_id?: string;
          status?: string;
          step_name?: string;
        };
        Relationships: [];
      };
      saved_roadmaps: {
        Row: {
          created_at: string;
          destination: string;
          id: string;
          nationality: string;
          purpose: string;
          roadmap: Json;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          destination: string;
          id?: string;
          nationality: string;
          purpose: string;
          roadmap: Json;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          destination?: string;
          id?: string;
          nationality?: string;
          purpose?: string;
          roadmap?: Json;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          status: string;
          tier: Database["public"]["Enums"]["subscription_tier"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          status?: string;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          status?: string;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_tier: {
        Args: { _user_id: string };
        Returns: Database["public"]["Enums"]["subscription_tier"];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_roadmap_usage: {
        Args: {
          _email: string;
          _fingerprint: string;
          _ip_hash: string;
          _month: string;
        };
        Returns: number;
      };
      is_admin_email: { Args: { _email: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "user";
      blog_gen_step: "plan" | "research" | "draft" | "fact_check" | "style" | "image" | "finalize";
      blog_post_status: "draft" | "in_review" | "published" | "archived";
      blog_queue_status: "queued" | "processing" | "done" | "failed" | "cancelled";
      personalized_request_kind: "roadmap" | "checklist_template";
      personalized_request_status: "queued" | "in_progress" | "ready" | "failed" | "cancelled";
      subscription_tier: "free" | "pro" | "pro_max";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      blog_gen_step: ["plan", "research", "draft", "fact_check", "style", "image", "finalize"],
      blog_post_status: ["draft", "in_review", "published", "archived"],
      blog_queue_status: ["queued", "processing", "done", "failed", "cancelled"],
      personalized_request_kind: ["roadmap", "checklist_template"],
      personalized_request_status: ["queued", "in_progress", "ready", "failed", "cancelled"],
      subscription_tier: ["free", "pro", "pro_max"],
    },
  },
} as const;
