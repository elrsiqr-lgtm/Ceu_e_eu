import { useState, type FormEvent, type ReactNode } from 'react';
import { signIn, signUp, requestPasswordReset, updatePassword } from '../lib/auth';
import { Sparkle } from './ui';
import { useSky } from '../lib/hooks';

function Frame({ children }: { children: ReactNode }) {
  const sky = useSky();
  return (
    <div className="app sky auth" style={sky}><div className="authbox">
      <Sparkle /><h1 className="brand">Entre o Céu e Eu</h1>
      <p className="tag">Guarde como estava o céu.<br />Guarde como você estava.</p>
      {children}
    </div></div>
  );
}

export function AuthScreen() {
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const go = (m: typeof mode) => { setMode(m); setErr(''); setMsg(''); };

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'forgot') {
        await requestPasswordReset(email);
        setMsg('Se houver uma conta com este e-mail, enviamos um link para redefinir a senha.');
      } else if (mode === 'up') {
        const { needsConfirmation } = await signUp(email, pw);
        if (needsConfirmation) { setMsg('Quase lá! Enviamos um link de confirmação para o seu e-mail.'); setMode('in'); setPw(''); }
      } else await signIn(email, pw); // sucesso: o App reage à sessão
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  const title = { in: 'Entrar', up: 'Criar conta', forgot: 'Enviar link' }[mode];
  return (
    <Frame>
      <form onSubmit={submit}>
        <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        {mode !== 'forgot' && (
          <label>Senha
            <input type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={mode === 'up' ? 8 : undefined}
              value={pw} onChange={(e) => setPw(e.target.value)} required />
          </label>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        {msg && <p className="ok" role="status">{msg}</p>}
        <button className="pill" disabled={busy}>{busy ? 'Aguarde…' : title}</button>
      </form>
      <div className="links">
        {mode !== 'in' && <button onClick={() => go('in')}>Já tenho conta</button>}
        {mode !== 'up' && <button onClick={() => go('up')}>Criar conta</button>}
        {mode === 'in' && <button onClick={() => go('forgot')}>Esqueci a senha</button>}
      </div>
      <p className="fine">Seus registros são privados: só você acessa suas fotos e textos.</p>
    </Frame>
  );
}

/** Mostrada quando o usuário chega pelo link de recuperação do e-mail. */
export function NewPasswordScreen({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await updatePassword(pw); onDone(); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  }
  return (
    <Frame>
      <form onSubmit={submit}>
        <label>Nova senha<input type="password" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="pill" disabled={busy}>{busy ? 'Aguarde…' : 'Salvar nova senha'}</button>
      </form>
    </Frame>
  );
}

export function SetupScreen() {
  return (
    <Frame>
      <p className="fine">Falta configurar o Supabase. Copie <code>.env.example</code> para <code>.env</code>, preencha <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> e reinicie o app. O passo a passo está no README.</p>
    </Frame>
  );
}
