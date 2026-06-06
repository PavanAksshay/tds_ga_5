import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  // Server-side rendering enabled (required for server loaders/actions and Supabase auth)
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;

