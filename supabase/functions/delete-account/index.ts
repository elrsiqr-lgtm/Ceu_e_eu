// Exclui a conta do usuário autenticado: fotos no Storage + usuário (o banco apaga o resto em cascata).
// Deploy: supabase functions deploy delete-account   (verify_jwt ligado, o padrão)
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL')!;
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // apaga todos os arquivos da pasta do usuário (em lotes)
  for (;;) {
    const { data: files, error } = await admin.storage.from('skies').list(user.id, { limit: 100 });
    if (error) return json({ error: error.message }, 500);
    if (!files?.length) break;
    const { error: rmErr } = await admin.storage.from('skies').remove(files.map((f) => `${user.id}/${f.name}`));
    if (rmErr) return json({ error: rmErr.message }, 500);
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
