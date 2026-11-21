import { useState, type FormEvent } from 'react';
import { signIn, signUp, resetPassword } from '../lib/auth';
import { Sparkle } from './ui';

export default function AuthScreen({ onAuth }: { onAuth: (id: string) => void }) {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'reset') { await resetPassword(email, pw); setMsg('Senha redefinida. Entre com a nova senha.'); setMode('in'); setPw(''); }
      else { const u = await (mode === 'up' ? signUp : signIn)(email, pw); onAuth(u.id); }
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  const title = { in: 'Entrar', up: 'Criar conta', reset: 'Redefinir senha' }[mode];
  return (
    <div className="app sky auth">
      <div className="authbox">
        <Sparkle />
        <h1 className="brand">Entre o Céu e Eu</h1>
        <p className="tag">Guarde como estava o céu.<br />Guarde como você estava.</p>
        <form onSubmit={submit}>
          <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>{mode === 'reset' ? 'Nova senha' : 'Senha'}
            <input type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={mode === 'in' ? undefined : 8} value={pw} onChange={(e) => setPw(e.target.value)} required />
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          {msg && <p className="ok" role="status">{msg}</p>}
          <button className="pill" disabled={busy}>{busy ? 'Aguarde…' : title}</button>
        </form>
        <div className="links">
          {mode !== 'in' && <button onClick={() => { setMode('in'); setErr(''); }}>Já tenho conta</button>}
          {mode !== 'up' && <button onClick={() => { setMode('up'); setErr(''); }}>Criar conta</button>}
          {mode === 'in' && <button onClick={() => { setMode('reset'); setErr(''); }}>Esqueci a senha</button>}
        </div>
        <p className="fine">Seus registros ficam privados e guardados neste aparelho.</p>
      </div>
    </div>
  );
}
