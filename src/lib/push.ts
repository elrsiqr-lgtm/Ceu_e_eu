import { supabase } from './supabase';

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const pushSupported = () =>
  Boolean(VAPID) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

function keyBytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/** Pede permissão, inscreve este aparelho no Web Push e guarda a inscrição no Supabase. */
export async function enablePush(userId: string): Promise<'ok' | 'denied' | 'unsupported'> {
  if (!pushSupported()) return 'unsupported';
  if ((await Notification.requestPermission()) !== 'granted') return 'denied';
  await subscribe(userId);
  return 'ok';
}

async function subscribe(userId: string) {
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID!) }));
  const j = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh: j.keys!.p256dh, auth: j.keys!.auth }, { onConflict: 'endpoint' });
  if (error) throw new Error(error.message);
}

/** Ao entrar de novo num aparelho que já tem permissão, recria a inscrição sem perguntar nada. */
export async function ensurePush(userId: string): Promise<void> {
  if (pushSupported() && Notification.permission === 'granted') await subscribe(userId);
}

export async function disablePush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
