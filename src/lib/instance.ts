import type { Backend } from "./backend";
import { LocalBackend } from "./localBackend";
import { SupabaseBackend } from "./supabaseBackend";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Sans configuration Supabase, l’application tourne en mode démonstration. */
export const backend: Backend = url && cle ? new SupabaseBackend(url, cle) : new LocalBackend();
