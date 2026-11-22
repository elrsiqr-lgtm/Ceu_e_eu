// Envia o lembrete diário por Web Push. Chamada pelo pg_cron a cada 15 min (ver supabase/cron.sql).
// Deploy: supabase functions deploy send-reminders --no-verify-jwt   (autentica pelo cabeçalho x-cron-secret)
// Segredos: CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex.: mailto:voce@exemplo.com)
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('forbidden', { status: 403 });

  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: due, error } = await admin.rpc('due_reminders');
  if (error) return new Response(error.message, { status: 500 });

  const payload = JSON.stringify({ title: 'Enlevo', body: 'Um novo céu espera por você.' });
  let notified = 0;
  for (const { user_id, local_date } of due ?? []) {
    const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', user_id);
    let delivered = false;
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3 * 3600 });
        delivered = true;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('id', s.id); // aparelho sumiu
      }
    }
    // só marca como lembrado se ao menos um aparelho recebeu; senão tenta de novo no próximo ciclo
    if (delivered) { await admin.from('user_settings').update({ last_reminded: local_date }).eq('user_id', user_id); notified++; }
  }
  return new Response(JSON.stringify({ due: due?.length ?? 0, notified }), { headers: { 'Content-Type': 'application/json' } });
});
