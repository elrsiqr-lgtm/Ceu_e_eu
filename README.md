# Entre o Céu e Eu

Diário visual privado: uma fotografia do céu por dia, com reflexões guiadas.
*Guarde como estava o céu. Guarde como você estava.*

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # regras de negócio e isolamento entre usuários
npm run build    # produção (PWA instalável)
```

## Decisões técnicas (questões pendentes do PRD)

- **Stack:** Vite + React + TypeScript, PWA mobile-first, sem backend.
- **Dados:** IndexedDB no aparelho (`src/lib/db.ts`). Todo acesso a memórias exige `userId` e confere a posse (F10); há testes. Para migrar a um backend (ex.: Supabase com RLS), basta reimplementar `db.ts`/`auth.ts`.
- **Datas:** string `YYYY-MM-DD` no fuso local do aparelho; índice único `(userId, data)` garante uma memória por dia.
- **Autenticação:** contas locais, senha com PBKDF2 (200 mil iterações) + sal. A "recuperação" redefine a senha com posse do aparelho — ver limitações.
- **Exclusão:** excluir a conta apaga usuário, memórias, rascunhos e configurações.
- **Rascunho:** foto e respostas são autosalvas e sobrevivem a recarregar a página.

## Limitações conhecidas do MVP local

- Dados não sincronizam entre aparelhos nem têm backup; limpar os dados do navegador apaga tudo. Exportação fica para depois.
- Sem backend, não há recuperação de conta por e-mail — e a redefinição local não protege contra quem tem acesso físico ao aparelho.
- Lembretes só disparam com o app aberto; lembrete com o app fechado exige Web Push + servidor.
- Sem service worker/offline-first ainda.
