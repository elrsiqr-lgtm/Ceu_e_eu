import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** false quando o .env ainda não foi preenchido: o app mostra uma tela de configuração. */
export const configured = Boolean(url && key);

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'sem-chave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
