import { users, uid, type User } from './db';

const KEY = 'ceu.session';
const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer)));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hash(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' }, key, 256));
}

export const normEmail = (e: string) => e.trim().toLowerCase();

export async function signUp(email: string, password: string): Promise<User> {
  email = normEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Informe um e-mail válido.');
  if (password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  if (await users.byEmail(email)) throw new Error('Já existe uma conta com este e-mail.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user: User = { id: uid(), email, salt: b64(salt), hash: await hash(password, salt), createdAt: Date.now() };
  await users.add(user);
  setSession(user.id);
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const user = await users.byEmail(normEmail(email));
  const ok = user && (await hash(password, unb64(user.salt))) === user.hash;
  if (!user || !ok) throw new Error('E-mail ou senha incorretos.');
  setSession(user.id);
  return user;
}

/** Redefine a senha. Como os dados vivem só neste aparelho, a posse do aparelho é a prova de acesso. */
export async function resetPassword(email: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  const user = await users.byEmail(normEmail(email));
  if (!user) throw new Error('Nenhuma conta com este e-mail neste aparelho.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  await users.update({ ...user, salt: b64(salt), hash: await hash(newPassword, salt) });
}

export const getSession = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setSession = (id: string) => { try { localStorage.setItem(KEY, id); } catch { /* ignore */ } };
export const signOut = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
