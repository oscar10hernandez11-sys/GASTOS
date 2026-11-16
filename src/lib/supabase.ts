import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(rawUrl: string | undefined): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/auth\/v1\/?$/i, '')
      .replace(/\/+$/, '');
  }
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = (rawAnonKey || '').trim();

const isValidHttpUrl =
  supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost');

const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey === 'tu_anon_key_de_supabase' ||
  supabaseAnonKey.includes('secret');

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl && !isPlaceholderKey
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch {
    supabase = null;
  }
}
