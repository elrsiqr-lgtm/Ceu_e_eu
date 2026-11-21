import { memories, settings } from './db';
import { todayISO } from './dates';

export const notificationsSupported = () => 'Notification' in window;

export async function requestPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

/**
 * Lembrete local: verifica a cada minuto enquanto o app está aberto.
 * Não avisa se o dia já foi registrado, nem mais de uma vez por dia.
 * (Lembretes com o app fechado exigem Web Push + backend — fora deste MVP local.)
 */
export function startReminderLoop(userId: string): () => void {
  const tick = async () => {
    if (!notificationsSupported() || Notification.permission !== 'granted') return;
    const s = await settings.get(userId);
    if (!s.remind) return;
    const now = new Date();
    const [h, m] = s.time.split(':').map(Number);
    const today = todayISO();
    if (s.lastReminded === today) return;
    if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
    if (await memories.byDate(userId, today)) return;
    new Notification('Entre o Céu e Eu', { body: 'Um novo céu espera por você.', icon: '/icon.svg' });
    await settings.put({ ...s, lastReminded: today });
  };
  tick();
  const id = setInterval(tick, 60_000);
  return () => clearInterval(id);
}
