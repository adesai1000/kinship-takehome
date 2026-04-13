import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          company: string;
          stage: "lead" | "contacted" | "qualified" | "trial_demo" | "closed";
          notes: string | null;
          stage_changed_at: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company: string;
          stage?: "lead" | "contacted" | "qualified" | "trial_demo" | "closed";
          notes?: string | null;
          stage_changed_at?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          company?: string;
          stage?: "lead" | "contacted" | "qualified" | "trial_demo" | "closed";
          notes?: string | null;
          stage_changed_at?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}
