// Sinhronizacija med napravami (Supabase: prijava z e-mailom + ena vrstica s podatki na uporabnika)
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = !!(URL && KEY);
const sb = configured ? createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

let user = null;
export const currentUser = () => user;

export async function init(onAuth) {
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  sb.auth.onAuthStateChange((_e, session) => {
    const u = session?.user || null;
    if ((u && u.id) !== (user && user.id)) { user = u; onAuth(u); }
  });
  return user;
}

const msg = e => {
  const m = e?.message || String(e);
  if (/Invalid login/i.test(m)) return 'Napačen e-mail ali geslo.';
  if (/not confirmed/i.test(m)) return 'Najprej potrdi e-mail (povezava v nabiralniku).';
  if (/already registered/i.test(m)) return 'Ta e-mail že ima račun. Uporabi Prijava.';
  if (/at least 6/i.test(m)) return 'Geslo mora imeti vsaj 6 znakov.';
  return m;
};
export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(msg(error));
  user = data.user; return user;
}
export async function signUp(email, password) {
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + '/' } });
  if (error) throw new Error(msg(error));
  if (!data.session) return null; // potrebna potrditev e-maila
  user = data.user; return user;
}
export async function signOut() { if (sb) await sb.auth.signOut(); user = null; }

export async function pull() {
  if (!sb || !user) return null;
  const { data, error } = await sb.from('user_data').select('data,updated_at').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(msg(error));
  return data; // {data, updated_at} ali null
}
export async function push(state) {
  if (!sb || !user) return;
  const { error } = await sb.from('user_data').upsert({ user_id: user.id, data: state, updated_at: new Date(state._updated || Date.now()).toISOString() });
  if (error) throw new Error(msg(error));
}
