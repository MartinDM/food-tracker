import { z } from "zod";

const configSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type AppConfig = z.infer<typeof configSchema>;

export function readConfig(env: Record<string, string | undefined>): AppConfig | null {
  const parsed = configSchema.safeParse(env);
  return parsed.success ? parsed.data : null;
}
