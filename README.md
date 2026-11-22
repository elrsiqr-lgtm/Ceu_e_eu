# Enlevo

Diário visual privado: uma fotografia do céu por dia, com reflexões guiadas.
*Olhe o céu. Guarde o hoje.* (antes chamado "Entre o Céu e Eu")

PWA mobile-first em Vite + React + TypeScript, com **Supabase** (Auth, Postgres, Storage, Edge Functions).

## Rodar localmente

```bash
npm install
cp .env.example .env     # preencha com os dados do seu projeto Supabase
npm run dev
npm test                 # regras de rotação de perguntas e compressão de fotos
npm run build
```

## Configurar o Supabase (uma vez)

1. **Projeto:** crie em supabase.com e copie *Project URL* e a chave *anon* (Project Settings > API) para o `.env`.
2. **Banco e Storage:** rode `supabase/migrations/0001_init.sql` no SQL Editor. Cria as tabelas com RLS (cada usuário só acessa o que é seu), o bucket privado `skies` (só JPEG, máx. 1 MB) e a função `due_reminders()`.
3. **Login e recuperação de senha:** em Authentication > URL Configuration, defina *Site URL* com o endereço do app e inclua-o (e `http://localhost:5173`) em *Redirect URLs*. O link do e-mail de recuperação abre o app numa tela de nova senha. Opcional: traduza os modelos em Authentication > Email Templates.
   - O SMTP padrão do Supabase tem limite muito baixo de e-mails por hora; para uso real configure um SMTP próprio (Authentication > SMTP Settings).
4. **Lembretes (Web Push):**
   ```bash
   npx web-push generate-vapid-keys            # gera o par de chaves
   # chave pública -> VITE_VAPID_PUBLIC_KEY no .env (e no ambiente de build)
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:voce@exemplo.com CRON_SECRET=um-segredo-longo
   supabase functions deploy send-reminders --no-verify-jwt
   supabase functions deploy delete-account
   ```
   Depois ative as extensões `pg_cron` e `pg_net` (Database > Extensions) e rode `supabase/cron.sql` (trocando `<PROJECT_REF>` e `<CRON_SECRET>`). A cada 15 min o servidor avisa quem ativou o lembrete, dentro de uma janela de 3 h a partir do horário escolhido, **só se o dia ainda não foi registrado** e no fuso do aparelho.

## Como funciona

- **Fotos:** ao salvar, a imagem é comprimida no aparelho para **≤ 480 KB** (tipicamente 300–480 KB; lado máx. 1920 px, reduzindo qualidade e depois dimensões até caber) e ganha uma miniatura de ~40 KB. No plano gratuito (1 GB) isso dá mais de 2 mil memórias. O bucket é privado; o app usa URLs assinadas temporárias.
- **Privacidade:** RLS em todas as tabelas e políticas de Storage por pasta (`<user_id>/…`). Restrições no banco impedem apontar para arquivos de outro usuário e garantem **uma memória por usuário e data**.
- **Datas:** `YYYY-MM-DD` no fuso local do aparelho.
- **Rascunho:** foto e respostas são autosalvas no aparelho (IndexedDB) e sobrevivem a recarregar a página ou a uma falha de rede ao salvar.
- **Exclusão de conta:** Edge Function (código em `supabase/functions/delete-account`; no painel ela foi publicada como `smart-api`, nome configurado em `src/lib/auth.ts`) apaga as fotos, o usuário e (em cascata) todos os registros.

## Limitações

- Lembretes push no iPhone só funcionam com o app adicionado à Tela de Início (iOS 16.4+).
- O plano gratuito pausa projetos inativos por ~1 semana.
- A lista de memórias carrega até 1000 registros de uma vez (limite padrão da API); paginar é a próxima evolução.
- Sem modo offline: salvar exige conexão (o rascunho fica guardado).
