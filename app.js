/* ============================================================
   StreamFusion — app.js
   Zero-dependency single-page multi-platform chat viewer
   ============================================================ */

'use strict';

// ── Constants ────────────────────────────────────────────────
const STORAGE_KEY = 'streamfusion_streams';

const PLATFORM_META = {
  youtube: {
    label: 'YouTube',
    colorClass: 'youtube',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  },
  twitch: {
    label: 'Twitch',
    colorClass: 'twitch',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
  },
  kick: {
    label: 'Kick',
    colorClass: 'kick',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 16.5l-3-3 3-3V8l-5 5 5 5v-1.5zm2 0V15l3-3-3-3V7.5l5 5-5 5z"/></svg>`,
  },
};

// ── URL Parsing ──────────────────────────────────────────────
const TWITCH_RESERVED = new Set([
  'videos','clips','following','directory','subscriptions',
  'friends','settings','login','signup','downloads','store',
  'prime','bits','turbo','jobs','p','legal',
]);

function parseURL(raw, hint) {
  if (!raw || !raw.trim()) return null;
  const str = raw.trim();

  // Bare name (no slashes/dots) → use hint
  if (hint && !/[./]/.test(str)) {
    if (hint === 'twitch' && /^[A-Za-z0-9_]{1,25}$/.test(str))
      return { platform: 'twitch', id: str.toLowerCase() };
    if (hint === 'kick' && /^[A-Za-z0-9_-]{1,50}$/.test(str))
      return { platform: 'kick', id: str.toLowerCase() };
  }

  let url;
  try { url = new URL(str.includes('://') ? str : 'https://' + str); }
  catch { return null; }

  const host = url.hostname.toLowerCase().replace(/^(?:www\.|m\.)/, '');
  const path = url.pathname;

  if (host === 'youtube.com') {
    const v = url.searchParams.get('v');
    if (v) return { platform: 'youtube', id: v };
    const m = path.match(/^\/(live|shorts|embed)\/([A-Za-z0-9_-]+)/);
    if (m) return { platform: 'youtube', id: m[2] };
    return null;
  }
  if (host === 'youtu.be') {
    const m = path.match(/^\/([A-Za-z0-9_-]+)/);
    return m ? { platform: 'youtube', id: m[1] } : null;
  }
  if (host === 'twitch.tv') {
    const m = path.match(/^\/([A-Za-z0-9_]+)/);
    if (m && !TWITCH_RESERVED.has(m[1].toLowerCase()))
      return { platform: 'twitch', id: m[1].toLowerCase() };
    return null;
  }
  if (host === 'kick.com') {
    const m = path.match(/^\/([A-Za-z0-9_-]+)/);
    if (m && m[1] !== 'video') return { platform: 'kick', id: m[1].toLowerCase() };
    return null;
  }
  return null;
}

function buildEmbedURL(platform, id) {
  const parent = location.hostname || 'localhost';
  switch (platform) {
    case 'youtube': return `https://www.youtube.com/live_chat?v=${encodeURIComponent(id)}&embed_domain=${parent}`;
    case 'twitch':  return `https://www.twitch.tv/embed/${encodeURIComponent(id)}/chat?parent=${parent}&darkpopout`;
    case 'kick':    return `https://kick.com/${encodeURIComponent(id)}/chatroom`;
    default: throw new Error('Unknown platform: ' + platform);
  }
}

// ── State ────────────────────────────────────────────────────
let streams = [];

function streamKey(p, id) { return `${p}:${id}`; }

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY,
      JSON.stringify(streams.map(({ platform, id }) => ({ platform, id }))));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved))
      saved.forEach(({ platform, id }) => { if (platform && id) addChat(platform, id, false); });
  } catch {}
}

// ── Wake Lock — keep screen on while streams are active ──────
let _wakeLock = null;

async function acquireWakeLock() {
  if (_wakeLock || !navigator.wakeLock) return;
  try { _wakeLock = await navigator.wakeLock.request('screen'); }
  catch {}
}

function releaseWakeLock() {
  _wakeLock?.release();
  _wakeLock = null;
}

// Re-acquire after tab becomes visible (browser auto-releases on hide)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && streams.length > 0) acquireWakeLock();
});

// ── DOM ──────────────────────────────────────────────────────
const grid           = document.getElementById('chat-grid');
const emptyState     = document.getElementById('empty-state');
const appBody        = document.getElementById('app-body');
const combinedMsgsEl = document.getElementById('combined-messages');

function updateEmptyState() {
  if (streams.length === 0) {
    emptyState.removeAttribute('hidden');
    appBody.setAttribute('hidden', '');
  } else {
    emptyState.setAttribute('hidden', '');
    appBody.removeAttribute('hidden');
  }
}

// ── Helpers ──────────────────────────────────────────────────
function escapeHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}

function renderTwitchText(text, emotesTag) {
  if (!emotesTag) return escapeHTML(text);

  // Build a map of character position → {end, id}
  const replacements = [];
  for (const part of emotesTag.split('/')) {
    const [id, positions] = part.split(':');
    if (!positions) continue;
    for (const range of positions.split(',')) {
      const [start, end] = range.split('-').map(Number);
      replacements.push({ start, end, id });
    }
  }
  if (!replacements.length) return escapeHTML(text);

  replacements.sort((a, b) => a.start - b.start);

  let result = '';
  let cursor = 0;
  for (const { start, end, id } of replacements) {
    result += escapeHTML(text.slice(cursor, start));
    const name = escapeAttr(text.slice(start, end + 1));
    result += `<img class="twitch-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0" alt="${name}" title="${name}">`;
    cursor = end + 1;
  }
  result += escapeHTML(text.slice(cursor));
  return result;
}

function renderKickText(text) {
  return text.split(/(\[emote:\d+:[^\]]*\])/).map(part => {
    const m = part.match(/^\[emote:(\d+):([^\]]*)\]$/);
    if (m) return `<img class="kick-emote" src="https://files.kick.com/emotes/${m[1]}/fullsize" alt="${escapeAttr(m[2])}" title="${escapeAttr(m[2])}">`;
    return escapeHTML(part);
  }).join('');
}

function addCombinedMessage(platform, username, text, isSystem, textHTML = null) {
  if (!combinedMsgsEl) return;
  const ph = combinedMsgsEl.querySelector('.combined-placeholder');
  if (ph) ph.remove();

  const el = document.createElement('div');
  if (isSystem) {
    el.className = 'combined-message system-msg';
    el.innerHTML = `<span class="msg-system-text">${escapeHTML(text)}</span>`;
  } else {
    el.className = 'combined-message';
    el.innerHTML =
      `<span class="msg-platform ${escapeAttr(platform)}">${escapeHTML(platform)}</span>` +
      `<span class="msg-author">${escapeHTML(username)}</span>` +
      `<span class="msg-sep">→</span>` +
      `<span class="msg-text">${textHTML ?? escapeHTML(text)}</span>`;
  }
  combinedMsgsEl.appendChild(el);
  while (combinedMsgsEl.children.length > 500)
    combinedMsgsEl.removeChild(combinedMsgsEl.firstChild);
  combinedMsgsEl.scrollTop = combinedMsgsEl.scrollHeight;
}

// ── Twitch IRC ───────────────────────────────────────────────
const twitchIRC = { ws: null, channels: new Set(), timer: null, active: false };

function twitchConnect() {
  if (twitchIRC.ws &&
      (twitchIRC.ws.readyState === WebSocket.CONNECTING ||
       twitchIRC.ws.readyState === WebSocket.OPEN)) return;

  const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
  twitchIRC.ws = ws;

  ws.addEventListener('open', () => {
    ws.send('PASS SCHMOOPIIE');
    ws.send('NICK justinfan' + (Math.floor(Math.random() * 80000) + 10000));
    ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    twitchIRC.channels.forEach(ch => ws.send('JOIN #' + ch));
  });

  ws.addEventListener('message', e => {
    for (const line of e.data.split('\r\n')) {
      if (!line) continue;
      if (line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); continue; }
      if (!line.includes('PRIVMSG')) continue;

      let displayName = '', emotesTag = '';
      const tagMatch = line.match(/^@([^ ]+)/);
      if (tagMatch) {
        const tags = tagMatch[1].split(';');
        const dn = tags.find(t => t.startsWith('display-name='));
        if (dn) displayName = dn.split('=')[1];
        const em = tags.find(t => t.startsWith('emotes='));
        if (em) emotesTag = em.slice(7);
      }
      const pm = line.match(/:([A-Za-z0-9_]+)![A-Za-z0-9_]+@[A-Za-z0-9_.]+\.tmi\.twitch\.tv PRIVMSG #[A-Za-z0-9_]+ :(.+)/);
      if (pm) addCombinedMessage('twitch', displayName || pm[1], pm[2], false, renderTwitchText(pm[2], emotesTag));
    }
  });

  ws.addEventListener('close', () => {
    if (twitchIRC.active && twitchIRC.channels.size > 0)
      twitchIRC.timer = setTimeout(twitchConnect, 5000);
  });

  ws.addEventListener('error', () => ws.close());
}

function joinTwitchChannel(ch) {
  twitchIRC.channels.add(ch);
  twitchIRC.active = true;
  if (twitchIRC.ws && twitchIRC.ws.readyState === WebSocket.OPEN)
    twitchIRC.ws.send('JOIN #' + ch);
  else
    twitchConnect();
}

function leaveTwitchChannel(ch) {
  twitchIRC.channels.delete(ch);
  if (twitchIRC.ws && twitchIRC.ws.readyState === WebSocket.OPEN)
    twitchIRC.ws.send('PART #' + ch);
  if (twitchIRC.channels.size === 0) {
    twitchIRC.active = false;
    clearTimeout(twitchIRC.timer);
    if (twitchIRC.ws) twitchIRC.ws.close();
    twitchIRC.ws = null;
  }
}

// ── Kick (Pusher WebSocket) ───────────────────────────────────
// Kick uses Pusher for real-time chat. We connect directly to Pusher
// and subscribe to the chatroom channel.

const KICK_PUSHER_KEY = '32cbd69e4b950bf97679';
const kickState = new Map(); // channel → { chatroomId, ws, reconnectTimer }

async function connectKickChat(channel) {
  if (kickState.has(channel)) return;
  kickState.set(channel, { chatroomId: null, ws: null, reconnectTimer: null });

  // Fetch chatroom ID with retry on 429
  let chatroomId = null;
  for (const url of [
    `https://kick.com/api/v2/channels/${encodeURIComponent(channel)}`,
    `https://kick.com/api/v1/channels/${encodeURIComponent(channel)}`,
  ]) {
    for (let i = 0; i < 3; i++) {
      if (i > 0) await sleep(2000 * i);
      try {
        const r = await fetch(url);
        if (r.status === 429) continue;
        if (!r.ok) break;
        const d = await r.json();
        chatroomId = d.chatroom?.id ?? d.id ?? null;
        if (chatroomId) break;
      } catch { break; }
    }
    if (chatroomId) break;
  }

  if (!kickState.has(channel)) return;

  if (!chatroomId) {
    kickState.delete(channel);
    addCombinedMessage('kick', '', `Kick (${channel}) — could not fetch chatroom info`, true);
    return;
  }

  const state = kickState.get(channel);
  state.chatroomId = chatroomId;
  kickPusherConnect(channel, chatroomId);
}

function kickPusherConnect(channel, chatroomId) {
  const state = kickState.get(channel);
  if (!state) return;

  const ws = new WebSocket(
    `wss://ws-us2.pusher.com/app/${KICK_PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`
  );
  state.ws = ws;

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data: { auth: '', channel: `chatrooms.${chatroomId}.v2` }
    }));
  });

  ws.addEventListener('message', e => {
    try {
      const packet = JSON.parse(e.data);
if (packet.event === 'App\\Events\\ChatMessageEvent') {
        const data = typeof packet.data === 'string' ? JSON.parse(packet.data) : packet.data;
        const text   = data.content ?? data.message ?? data.text;
        const sender = data.sender?.username ?? data.sender?.slug ?? data.sender?.name;
        if (text && sender) addCombinedMessage('kick', sender, text, false, renderKickText(text));
      }
    } catch {}
  });

  ws.addEventListener('close', e => {
    if (kickState.has(channel)) {
      state.reconnectTimer = setTimeout(() => kickPusherConnect(channel, chatroomId), 5000);
    }
  });

  ws.addEventListener('error', () => {
  });
}

function disconnectKickChat(channel) {
  const state = kickState.get(channel);
  if (state) {
    clearTimeout(state.reconnectTimer);
    if (state.ws) state.ws.close();
  }
  kickState.delete(channel);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── YouTube Live Chat (InnerTube via local proxy) ────────────
// Requests go to the local server.js proxy which forwards them to YouTube
// and adds CORS headers. Run `node server.js` before opening the app.
const YT_PROXY    = 'http://localhost:3001';
const YT_KEY      = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const YT_CLIENT   = { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'US' };

const ytChatState = new Map(); // videoId → { continuation, timer, active, seenIds }

function ytRunsToText(runs) {
  return (runs ?? []).map(r => {
    if (r.text) return r.text;
    if (r.emoji) return r.emoji.isCustomEmoji ? (r.emoji.shortcuts?.[0] ?? '') : (r.emoji.emojiId ?? '');
    return '';
  }).join('');
}

// Recursively find liveChatRenderer anywhere in the InnerTube response
// and extract the first valid continuation token from it.
function findYTContinuation(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 20) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findYTContinuation(item, depth + 1);
      if (r) return r;
    }
    return null;
  }
  if (obj.liveChatRenderer) {
    for (const c of obj.liveChatRenderer.continuations ?? []) {
      const token = c.invalidationContinuationData?.continuation
        ?? c.timedContinuationData?.continuation
        ?? c.reloadContinuationData?.continuation;
      if (token) return token;
    }
  }
  for (const val of Object.values(obj)) {
    const r = findYTContinuation(val, depth + 1);
    if (r) return r;
  }
  return null;
}

async function connectYouTubeChat(videoId) {
  if (ytChatState.has(videoId)) return;
  const state = { continuation: null, timer: null, active: true, seenIds: new Set() };
  ytChatState.set(videoId, state);
  try {
    const r = await fetch(`${YT_PROXY}/youtubei/v1/next?key=${YT_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: YT_CLIENT }, videoId }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (!ytChatState.has(videoId)) return;

    const continuation = findYTContinuation(d);
    if (!continuation) {
      addCombinedMessage('youtube', '', `YouTube (${videoId}) — no active live chat found`, true);
      ytChatState.delete(videoId);
      return;
    }
    state.continuation = continuation;
    pollYouTubeChat(videoId);
  } catch (e) {
    if (!ytChatState.has(videoId)) return;
    ytChatState.delete(videoId);
    const msg = e.name === 'TypeError'
      ? 'YouTube proxy not running — open a terminal and run: node server.js'
      : `YouTube — failed to connect (${e.message})`;
    addCombinedMessage('youtube', '', msg, true);
  }
}

async function pollYouTubeChat(videoId) {
  const state = ytChatState.get(videoId);
  if (!state || !state.active) return;
  try {
    const r = await fetch(`${YT_PROXY}/youtubei/v1/live_chat/get_live_chat?key=${YT_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: YT_CLIENT }, continuation: state.continuation }),
    });
    if (!ytChatState.has(videoId)) return;
    const d = await r.json();
    const lc = d?.continuationContents?.liveChatContinuation;
    if (!lc) { state.timer = setTimeout(() => pollYouTubeChat(videoId), 5000); return; }

    const nc = lc?.continuations?.[0];
    const nextToken = nc?.invalidationContinuationData?.continuation
      ?? nc?.timedContinuationData?.continuation;
    if (nextToken) state.continuation = nextToken;

    const interval = Math.max(
      nc?.timedContinuationData?.timeoutMs ?? nc?.invalidationContinuationData?.timeoutMs ?? 5000,
      2000
    );

    for (const action of lc?.actions ?? []) {
      const item = action?.addChatItemAction?.item;
      if (!item) continue;
      const msg = item.liveChatTextMessageRenderer ?? item.liveChatPaidMessageRenderer;
      if (!msg || state.seenIds.has(msg.id)) continue;
      state.seenIds.add(msg.id);
      const author = msg?.authorName?.simpleText;
      const text = ytRunsToText(msg?.message?.runs);
      if (author && text) addCombinedMessage('youtube', author, text, false);
    }

    if (state.seenIds.size > 1000) state.seenIds = new Set([...state.seenIds].slice(-500));
    state.timer = setTimeout(() => pollYouTubeChat(videoId), interval);
  } catch {
    if (ytChatState.has(videoId))
      ytChatState.get(videoId).timer = setTimeout(() => pollYouTubeChat(videoId), 10000);
  }
}

function disconnectYouTubeChat(videoId) {
  const state = ytChatState.get(videoId);
  if (state) {
    state.active = false;
    clearTimeout(state.timer);
    ytChatState.delete(videoId);
  }
}

// ── Chat Management ──────────────────────────────────────────
function addChat(platform, id, persist = true) {
  const key = streamKey(platform, id);
  if (streams.find(s => s.key === key)) return;

  const meta = PLATFORM_META[platform];
  if (!meta) return;

  const card = document.createElement('div');
  card.className = 'chat-card';
  card.dataset.key = key;
  card.innerHTML = `
    <div class="card-header ${meta.colorClass}">
      <span class="card-platform-icon">${meta.icon}</span>
      <span class="card-title">${meta.label}</span>
      <span class="card-id" title="${escapeAttr(id)}">${escapeHTML(id)}</span>
      <button class="card-remove" aria-label="Remove ${meta.label} chat">×</button>
    </div>
    <iframe
      class="card-iframe"
      src="${escapeAttr(buildEmbedURL(platform, id))}"
      title="${escapeAttr(meta.label + ' chat for ' + id)}"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allow="autoplay; clipboard-write"
      ${platform === 'youtube' ? 'sandbox="allow-scripts allow-same-origin allow-forms allow-popups"' : ''}
    ></iframe>`;

  card.querySelector('.card-remove').addEventListener('click', () => removeChat(card));
  grid.appendChild(card);
  streams.push({ platform, id, key });

  if (platform === 'twitch') {
    joinTwitchChannel(id);
  } else if (platform === 'kick') {
    connectKickChat(id);
  } else if (platform === 'youtube') {
    connectYouTubeChat(id);
  }

  if (persist) saveState();
  acquireWakeLock();
  updateEmptyState();
}

function removeChat(cardEl) {
  const key = cardEl.dataset.key;
  const stream = streams.find(s => s.key === key);
  streams = streams.filter(s => s.key !== key);
  if (stream?.platform === 'twitch') leaveTwitchChannel(stream.id);
  if (stream?.platform === 'kick')   disconnectKickChat(stream.id);
  if (stream?.platform === 'youtube') disconnectYouTubeChat(stream.id);
  cardEl.remove();
  saveState();
  if (streams.length === 0) releaseWakeLock();
  updateEmptyState();
}

// ── Modal ────────────────────────────────────────────────────
const overlay        = document.getElementById('modal-overlay');
const btnAdd         = document.getElementById('btn-add-stream');
const btnEmptyAdd    = document.getElementById('btn-empty-add');
const btnClose       = document.getElementById('btn-modal-close');
const btnCancel      = document.getElementById('btn-modal-cancel');
const btnConfirm     = document.getElementById('btn-modal-confirm');
const btnStepBack    = document.getElementById('btn-step-back');
const stepPlatformEl = document.getElementById('modal-step-platform');
const stepURLEl      = document.getElementById('modal-step-url');
const inputURL       = document.getElementById('input-stream-url');
const hintURL        = document.getElementById('hint-stream-url');
const step2PlatName  = document.getElementById('step2-platform-name');

let selectedPlatform = null;

const URL_PLACEHOLDERS = {
  youtube: 'https://youtube.com/watch?v=...  or  youtu.be/...',
  twitch:  'https://twitch.tv/channelname  or  channelname',
  kick:    'https://kick.com/channelname  or  channelname',
};

function openModal()  { selectedPlatform = null; showStep(1); overlay.removeAttribute('hidden'); }
function closeModal() { overlay.setAttribute('hidden', ''); }

function showStep(step) {
  if (step === 1) {
    stepPlatformEl.removeAttribute('hidden');
    stepURLEl.setAttribute('hidden', '');
    btnConfirm.setAttribute('hidden', '');
    document.getElementById('modal-title').textContent = 'Add Stream Chat';
  } else {
    stepPlatformEl.setAttribute('hidden', '');
    stepURLEl.removeAttribute('hidden');
    btnConfirm.removeAttribute('hidden');
    const meta = PLATFORM_META[selectedPlatform];
    document.getElementById('modal-title').textContent = `Add ${meta.label} Chat`;
    step2PlatName.textContent = meta.label;
    step2PlatName.className = `step2-platform-badge ${selectedPlatform}`;
    inputURL.placeholder = URL_PLACEHOLDERS[selectedPlatform];
    inputURL.value = '';
    inputURL.className = 'url-input';
    hintURL.textContent = '';
    hintURL.className = 'input-hint';
    inputURL.focus();
  }
}

document.querySelectorAll('.platform-pick-btn').forEach(btn => {
  btn.addEventListener('click', () => { selectedPlatform = btn.dataset.platform; showStep(2); });
});
btnStepBack.addEventListener('click', () => showStep(1));

function validateInput() {
  const val = inputURL.value.trim();
  if (!val) {
    inputURL.className = 'url-input';
    hintURL.textContent = '';
    hintURL.className = 'input-hint';
    return null;
  }
  const parsed = parseURL(val, selectedPlatform);
  if (!parsed) {
    inputURL.className = 'url-input invalid';
    hintURL.textContent = 'Could not parse — paste the full URL or just the channel name.';
    hintURL.className = 'input-hint invalid';
    return null;
  }
  inputURL.className = 'url-input valid';
  hintURL.textContent = parsed.platform !== selectedPlatform
    ? `Detected ${PLATFORM_META[parsed.platform].label} — will add as ${PLATFORM_META[parsed.platform].label}`
    : `Detected: ${parsed.id}`;
  hintURL.className = 'input-hint valid';
  return parsed;
}

function handleConfirm() {
  const parsed = validateInput();
  if (!parsed) return;
  addChat(parsed.platform, parsed.id);
  closeModal();
}

inputURL.addEventListener('input', validateInput);
btnAdd.addEventListener('click', openModal);
btnEmptyAdd.addEventListener('click', openModal);
btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);
btnConfirm.addEventListener('click', handleConfirm);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (overlay.hasAttribute('hidden')) return;
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key === 'Enter' && !stepURLEl.hasAttribute('hidden') &&
      e.target !== btnCancel && e.target !== btnClose && e.target !== btnStepBack)
    handleConfirm();
});

// ── Overlay ──────────────────────────────────────────────────
function buildOverlayURL() {
  const twitch = streams.filter(s => s.platform === 'twitch').map(s => s.id);
  const kick   = streams.filter(s => s.platform === 'kick').map(s => s.id);
  const p = new URLSearchParams();
  if (twitch.length) p.set('twitch', twitch.join(','));
  if (kick.length)   p.set('kick',   kick.join(','));
  const base = new URL('overlay.html', location.href);
  base.search = p.toString();
  return base.toString();
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}

document.getElementById('btn-overlay').addEventListener('click', () => {
  if (streams.length === 0) {
    showToast('Add at least one stream first.');
    return;
  }
  const url = buildOverlayURL();
  window.open(url, 'sf-overlay', 'width=440,height=700,resizable=yes');
  navigator.clipboard?.writeText(url)
    .then(() => showToast('Overlay opened & URL copied — paste into OBS Browser Source!'))
    .catch(() => showToast('Overlay opened — copy the URL from the new window for OBS.'));
});

document.getElementById('btn-clear-all').addEventListener('click', () => {
  [...grid.querySelectorAll('.chat-card')].forEach(card => removeChat(card));
});


updateEmptyState();
loadState();
