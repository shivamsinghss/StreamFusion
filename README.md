# StreamFusion

**One dashboard. Every chat. All platforms.**

StreamFusion is a multi-platform live chat aggregator that unifies real-time chat from YouTube, Twitch, and Kick into a single view — with a built-in OBS overlay, popout chat window, live stream titles, and zero accounts, subscriptions, or npm packages.

---

## The Problem

Multi-platform streamers open 3 browser tabs to watch chat. They miss messages. They lose context. Moderators can't keep up. Viewers get ignored.

## The Solution

StreamFusion pulls all your chats into one place — live, side by side, with a unified feed that aggregates every message regardless of platform.

---

## Features

### Multi-Platform Chat Aggregation
- **YouTube** — real-time chat via YouTube's InnerTube API (local proxy, no API key)
- **Twitch** — native IRC WebSocket connection (no API key required)
- **Kick** — Pusher WebSocket integration with native emote rendering

### Live Stream Titles
Each chat card displays the live stream title fetched automatically when you add a stream:
- **YouTube** — title extracted from the InnerTube `/next` response
- **Twitch** — live stream title fetched via Twitch's public GQL API (no OAuth)
- **Kick** — session title fetched from the Kick channel API

### Unified Combined Chat
All platforms feed into a single chronological stream. Every message tagged by platform so you never lose context.

### Popout Chat Window
Click the popout button on the Combined Chat panel to open the unified feed in its own persistent window. The popout uses Web Locks, an inline Web Worker, and a canvas animation loop to prevent Chrome from closing or freezing the window due to inactivity.

### Native Emote Rendering
- **Twitch** — emotes rendered from IRC tag position data via Twitch's CDN
- **Kick** — emotes rendered inline from `[emote:id:name]` syntax

### OBS / Streamlabs Overlay
One click opens a chat overlay window with five animation styles (Slide Up, Pop, Fade, Glide, Drop). Copy the browser source URL and paste it into OBS or Streamlabs. No configuration needed.

### Screen Always On
Uses the browser Wake Lock API to keep your display active during broadcasts.

### Persistent Sessions
Streams are saved to `localStorage` — your layout survives page refreshes automatically.

---

## Getting Started

**Requires Node.js** (no npm install needed — zero external packages).

```bash
git clone https://github.com/yourname/streamfusion.git
cd streamfusion
node server.js
```

Then open **http://localhost:3001** in Chrome.

That's the entire setup. One command.

---

## Usage

1. Click **Add Stream**
2. Pick a platform — YouTube, Twitch, or Kick
3. Paste the stream URL or channel name
4. The stream title loads automatically in the card header
5. Repeat for as many streams as you want
6. Watch all chats live in the **Combined Chat** sidebar

### Popout Chat
Click the popout icon (↗) on the Combined Chat header to open the unified feed in a separate window. Keep it on a second monitor or floating above your stream.

### OBS / Streamlabs Overlay

1. Click **Overlay** in the toolbar
2. The overlay config window opens — pick an animation style
3. Copy the browser source URL (dark or transparent background)
4. Paste into OBS Browser Source (recommended size: 400×700)

---

## Platform Support

| Platform | Chat Method           | Stream Title Source    | Combined Chat | Emotes | Auth Required |
|----------|-----------------------|------------------------|---------------|--------|---------------|
| YouTube  | InnerTube API (proxy) | InnerTube `/next`      | Yes           | —      | No            |
| Twitch   | IRC WebSocket         | Twitch public GQL API  | Yes           | Yes    | No            |
| Kick     | Pusher WebSocket      | Kick channel API       | Yes           | Yes    | No            |

All three platforms work without any API keys, accounts, or subscriptions.

---

## Architecture

```
streamfusion/
├── index.html      # Main app UI
├── app.js          # All logic: connections, state, DOM
├── style.css       # Styling
├── overlay.html    # OBS/Streamlabs chat overlay
├── popout.html     # Standalone combined chat window
└── server.js       # Local server: static files + YouTube proxy
```

- **Twitch**: Anonymous IRC via `wss://irc-ws.chat.twitch.tv` — no token, no rate limits. Stream titles via `gql.twitch.tv/gql` with public client ID.
- **Kick**: Direct Pusher WebSocket to `chatrooms.{id}.v2` — no polling. Stream title from the Kick channel API.
- **YouTube**: InnerTube API (`/youtubei/v1/...`) via local proxy — bypasses browser CORS restriction without any API key. Title extracted from the same `/next` call.
- **Popout**: Uses the Web Locks API, an inline Web Worker, and a canvas `requestAnimationFrame` loop to prevent Chrome from closing the window due to inactivity.
- **State**: `localStorage` — no sync, no account
- **Dependencies**: zero npm packages — pure Node.js built-ins only (`http`, `https`, `fs`, `path`)

The local proxy is the only reason Node.js is required. YouTube blocks cross-origin requests from the browser; the proxy forwards them from localhost and adds CORS headers. All chat data stays on your machine.

---

## Roadmap

- [ ] Per-platform message filters and keyword highlights
- [ ] Moderator actions (ban, timeout) from the unified view
- [ ] Custom overlay themes and font scaling
- [ ] Hosted cloud version (no `node server.js` step)
- [ ] TikTok Live support
- [ ] Mobile companion view (read-only combined chat)

---

## Why StreamFusion?

| | StreamFusion | Restream | Chatterino | StreamElements |
|---|---|---|---|---|
| YouTube + Twitch + Kick unified chat | ✅ | ✅ | Twitch only | ✅ |
| Live stream titles (all platforms) | ✅ | ✅ | ✅ | ✅ |
| OBS overlay | ✅ | Paid | ❌ | ✅ |
| Popout chat window | ✅ | ❌ | ❌ | ❌ |
| No account required | ✅ | ❌ | ✅ | ❌ |
| No subscription | ✅ | ❌ ($16–$49/mo) | ✅ | Freemium |
| Kick native emotes | ✅ | ❌ | ❌ | ❌ |
| Twitch native emotes | ✅ | ✅ | ✅ | ✅ |
| Data stays on your machine | ✅ | ❌ | ✅ | ❌ |
| Self-hostable | ✅ | ❌ | ✅ | ❌ |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT — free to use, fork, and build on.
