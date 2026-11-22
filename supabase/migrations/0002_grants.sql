-- Projetos Supabase novos não concedem privilégios automaticamente às tabelas do schema public.
-- As políticas RLS continuam valendo: estes GRANTs só permitem que o RLS seja avaliado.
-- anon (visitante sem login) fica sem acesso algum.
grant select, insert, update, delete on public.memories, public.user_settings, public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.memories, public.user_settings, public.push_subscriptions to service_role;
