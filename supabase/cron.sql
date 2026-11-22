-- Agenda o envio de lembretes a cada 15 minutos. NÃO é migração (contém segredo).
-- 1) Ative as extensões em Database > Extensions: pg_cron e pg_net.
-- 2) Troque <PROJECT_REF> e <CRON_SECRET> (o mesmo valor do segredo da função) e rode no SQL Editor.
select cron.schedule(
  'send-reminders',
  '*/15 * * * *',
  $$ select net.http_post(
       url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
       headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
       body    := '{}'::jsonb
     ) $$
);
