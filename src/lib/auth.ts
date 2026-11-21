import { supabase } from './supabase';
import { disablePush } from './push';

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('not confirmed')) return 'Confirme seu e-mail (veja a caixa de entrada) antes de entrar.';
  if (m.includes('already registered')) return 'Já existe uma conta com este e-mail.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  if (m.includes('password') && m.includes('characters')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (m.includes('same password') || m.includes('different from the old')) return 'Escolha uma senha diferente da anterior.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão. Verifique a internet e tente de novo.';
  return message;
}
const fail = (e: { message: string }): never => { throw new Error(friendly(e.message)); };
const MIN_PW = 8;

/** Retorna `needsConfirmation` quando o projeto exige confirmação de e-mail antes do primeiro login. */
export async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  if (password.length < MIN_PW) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
  if (error) return fail(error);
  // com confirmação ligada, e-mail já existente volta "sucesso" sem identidades
  if (data.user && data.user.identities?.length === 0) throw new Error('Já existe uma conta com este e-mail.');
  return { needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) fail(error);
}

/** Envia o e-mail de recuperação. O link volta ao app e dispara o evento PASSWORD_RECOVERY. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
  if (error) fail(error);
}

export async function updatePassword(password: string): Promise<void> {
  if (password.length < MIN_PW) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) fail(error);
}

export async function signOut(): Promise<void> {
  await disablePush().catch(() => {}); // a inscrição pertence ao usuário que sai
  await supabase.auth.signOut();
}

/** Exclui conta, fotos e registros (Edge Function `delete-account`), depois encerra a sessão. */
export async function deleteAccount(): Promise<void> {
  await disablePush().catch(() => {});
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw new Error('Não foi possível excluir a conta agora. Tente novamente.');
  await supabase.auth.signOut({ scope: 'local' });
}
