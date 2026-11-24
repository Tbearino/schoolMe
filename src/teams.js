// Microsoft Teams povezava (MSAL + Microsoft Graph)
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const CLIENT_ID = 'f059a5fc-85c0-46ec-9fb6-1e867cc2e4bc';
const TENANT_ID = '8f5b6e69-02ed-473c-80cf-aeb54d991f78';

// Osnovna dovoljenja ob prijavi (vsa so ta, ki jih lahko odobri študent sam)
const BASE = ['User.Read', 'Team.ReadBasic.All', 'Channel.ReadBasic.All', 'Chat.Read', 'Calendars.Read'];
// Sporočila v kanalih: zahtevamo šele, ko odpreš kanal
const CHANNEL_MSG = ['ChannelMessage.Read.All'];

const msal = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin + '/',
    postLogoutRedirectUri: window.location.origin + '/',
  },
  cache: { cacheLocation: 'localStorage' },
});

let ready = null;
export function initTeams() {
  if (!ready) ready = (async () => {
    await msal.initialize();
    const res = await msal.handleRedirectPromise().catch(e => { console.warn(e); return null; });
    if (res?.account) msal.setActiveAccount(res.account);
    else if (!msal.getActiveAccount() && msal.getAllAccounts()[0]) msal.setActiveAccount(msal.getAllAccounts()[0]);
    return account();
  })();
  return ready;
}

export const account = () => msal.getActiveAccount();
export const login = () => msal.loginRedirect({ scopes: BASE, prompt: 'select_account' });
export const logout = () => msal.logoutRedirect({ account: account() });

async function token(scopes) {
  try {
    return (await msal.acquireTokenSilent({ scopes, account: account() })).accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) { await msal.acquireTokenRedirect({ scopes }); }
    throw e;
  }
}

export class GraphError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

async function graph(path, scopes = BASE) {
  const t = await token(scopes);
  const r = await fetch('https://graph.microsoft.com/v1.0' + path, { headers: { Authorization: 'Bearer ' + t } });
  if (!r.ok) {
    let msg = r.statusText;
    try { msg = (await r.json()).error?.message || msg; } catch {}
    throw new GraphError(r.status, msg);
  }
  return r.json();
}

// HTML sporočil → navaden tekst (varno, brez HTML)
const toText = html => {
  const d = new DOMParser().parseFromString(String(html || ''), 'text/html');
  d.querySelectorAll('br,p,div').forEach(n => n.append('\n'));
  return (d.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
};
const msg = m => ({
  id: m.id,
  from: m.from?.user?.displayName || m.from?.application?.displayName || 'Sistem',
  when: m.createdDateTime,
  text: toText(m.body?.content) || (m.attachments?.length ? '📎 Priponka' : ''),
  subject: m.subject || '',
});

export const getTeams = async () => (await graph('/me/joinedTeams')).value.map(t => ({ id: t.id, name: t.displayName, desc: t.description || '' }));
export const getChannels = async teamId => (await graph(`/teams/${encodeURIComponent(teamId)}/channels`)).value.map(c => ({ id: c.id, name: c.displayName }));
export const getChannelMessages = async (teamId, chId) =>
  (await graph(`/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(chId)}/messages?$top=30`, CHANNEL_MSG)).value
    .filter(m => m.messageType === 'message').map(msg);

export const getChats = async () => (await graph('/me/chats?$expand=lastMessagePreview&$top=30')).value.map(c => ({
  id: c.id,
  name: c.topic || (c.chatType === 'oneOnOne' ? 'Zasebni klepet' : c.chatType === 'meeting' ? 'Klepet sestanka' : 'Skupinski klepet'),
  type: c.chatType,
  last: c.lastMessagePreview ? toText(c.lastMessagePreview.body?.content) : '',
  lastFrom: c.lastMessagePreview?.from?.user?.displayName || '',
  when: c.lastMessagePreview?.createdDateTime || c.lastUpdatedDateTime,
})).sort((a, b) => String(b.when).localeCompare(String(a.when)));
export const getChatMessages = async chatId =>
  (await graph(`/chats/${encodeURIComponent(chatId)}/messages?$top=30`)).value.filter(m => m.messageType === 'message').map(msg);

// Sestanki/predavanja iz Teams koledarja (naslednjih 21 dni), v lokalnem času
export async function getEvents(from, days = 21) {
  const start = new Date(from), end = new Date(from); end.setDate(end.getDate() + days);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const t = await token(BASE);
  const r = await fetch(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}&$top=100&$orderby=start/dateTime&$select=subject,start,end,location,isOnlineMeeting,onlineMeeting,isCancelled`, {
    headers: { Authorization: 'Bearer ' + t, Prefer: `outlook.timezone="${tz}"` },
  });
  if (!r.ok) throw new GraphError(r.status, r.statusText);
  return (await r.json()).value.filter(e => !e.isCancelled).map(e => ({
    id: 'ms-' + e.id,
    subject: e.subject || 'Sestanek',
    date: e.start.dateTime.slice(0, 10),
    start: e.start.dateTime.slice(11, 16),
    end: e.end.dateTime.slice(11, 16),
    room: e.location?.displayName || (e.isOnlineMeeting ? 'Teams' : ''),
    join: e.onlineMeeting?.joinUrl || '',
    teams: true,
  }));
}
