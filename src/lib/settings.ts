import { supabase } from './supabase';

export interface Settings { remind: boolean; time: string }
export const DEFAULT_SETTINGS: Settings = { remind: false, time: '18:00' };
export const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

export const settings = {
  async get(userId: string): Promise<Settings> {
    const { data, error } = await supabase.from('user_settings').select('remind, remind_time').eq('user_id', userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? { remind: data.remind, time: String(data.remind_time).slice(0, 5) } : DEFAULT_SETTINGS;
  },
  async save(userId: string, s: Settings): Promise<void> {
    const { error } = await supabase.from('user_settings').upsert(
      { user_id: userId, remind: s.remind, remind_time: s.time, timezone: deviceTimezone() }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
  },
  /** Mantém o fuso do lembrete alinhado ao aparelho (viagens, horário de verão). */
  async syncTimezone(userId: string): Promise<void> {
    await supabase.from('user_settings').update({ timezone: deviceTimezone() }).eq('user_id', userId);
  },
};
