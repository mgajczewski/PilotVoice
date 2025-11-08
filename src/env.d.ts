/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: {
        id: string;
        email: string;
        role: Database["public"]["Enums"]["user_role"];
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL?: string;
  readonly PUBLIC_RECAPTCHA_SITE_KEY: string;
  readonly RECAPTCHA_SECRET_KEY: string;
  readonly SITE?: string;
  readonly MOCK_AI_SERVICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
