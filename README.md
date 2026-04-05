# StreamFusion

**One dashboard. Every chat. All platforms.**

StreamFusion is a zero-dependency, browser-based tool that unifies live chat from YouTube, Twitch, and Kick into a single real-time view — with a built-in OBS/Streamlabs overlay, no installs, no accounts, no backend.

---

## The Problem

Multi-platform streamers open 3 browser tabs to watch chat. They miss messages. They lose context. Moderators can't keep up. Viewers get ignored.

## The Solution

StreamFusion pulls all your chats into one place — live, side by side, with a unified feed that aggregates every message regardless of platform.

---

## Features

### Multi-Platform Chat Aggregation
- **YouTube** — embedded live chat iframe
- **Twitch** — native IRC WebSocket connection (real-time, no API key required)
- **Kick** — Pusher WebSocket integration with native emote rendering

### Unified Combined Chat
All platforms feed into a single chronological stream. Every message tagged by platform so you never lose context.

### Kick Emotes
Kick emotes render as images inline — not raw `[emote:id:name]` text like every other third-party tool.

### OBS / Streamlabs Overlay
One click opens a chat overlay window. Copy the browser source URL directly from the overlay — with or without transparent background — and paste it into OBS or Streamlabs. No configuration needed.

### Zero Dependencies
- No npm, no bundler, no backend
- No API keys, no OAuth, no accounts
- One HTML file. Open in any browser.

### Persistent Sessions
Streams are saved to `localStorage` — your layout survives page refreshes automatically.

---

## Getting Started

```bash
git clone https://github.com/yourname/streamfusion.git
cd streamfusion
open index.html        # macOS
# or just drag index.html into your browser
```

That's it. No `npm install`. No server. No setup.

---

## Usage

1. Click **Add Stream**
2. Pick a platform — YouTube, Twitch, or Kick
3. Paste the stream URL or just the channel name
4. Repeat for as many streams as you want
5. Watch all chats live in the **Combined Chat** sidebar

### OBS / Streamlabs Overlay

1. Click **Overlay** in the toolbar
2. The overlay window opens — copy either URL from the grid:
   - **Copy for OBS / Streamlabs** — standard dark background
   - **Copy with Transparent BG** — transparent, composites over any scene
3. Paste into OBS Browser Source (recommended size: 400×700)

---

## Platform Support

| Platform | Chat Method         | Emotes | Auth Required |
|----------|---------------------|--------|---------------|
| YouTube  | Embedded iframe     | —      | No            |
| Twitch   | IRC WebSocket       | —      | No            |
| Kick     | Pusher WebSocket    | Yes    | No            |

---

## Architecture

StreamFusion is intentionally zero-dependency and self-contained:

```
streamfusion/
├── index.html      # Main app UI
├── app.js          # All logic: connections, state, DOM
├── overlay.html    # OBS/Streamlabs chat overlay (self-contained)
└── style.css       # Styling
```

- **Twitch**: Anonymous IRC via `wss://irc-ws.chat.twitch.tv` — no token, no rate limits
- **Kick**: Direct Pusher WebSocket subscription to `chatrooms.{id}.v2` — no polling
- **YouTube**: Embedded iframe (YouTube's own chat widget)
- **State**: `localStorage` — no server, no sync, no account

---

## Roadmap

- [ ] YouTube combined chat via Data API
- [ ] Per-platform message filters and keyword highlights
- [ ] Moderator actions (ban, timeout) from the unified view
- [ ] Custom overlay themes and font scaling
- [ ] TikTok Live support
- [ ] Electron / desktop app packaging

---

## Why StreamFusion?

| | StreamFusion | Restream | Chatterino | StreamElements |
|---|---|---|---|---|
| Multi-platform chat view | ✅ | ✅ | Twitch only | ✅ |
| OBS overlay | ✅ | Paid | ❌ | ✅ |
| No account required | ✅ | ❌ | ✅ | ❌ |
| No install | ✅ | ❌ | ❌ | ❌ |
| Kick native emotes | ✅ | ❌ | ❌ | ❌ |
| Self-hostable | ✅ | ❌ | ✅ | ❌ |
| Free | ✅ | Freemium | ✅ | Freemium |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT — free to use, fork, and build on.
