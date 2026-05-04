# StreamFusion — Business Pitch

> **The only tool a live streamer needs to manage chat across every platform — in one place, in real time.**

---

## The Problem

The live streaming industry is no longer platform-exclusive. Today's creators stream simultaneously on **YouTube**, **Twitch**, and **Kick** — and their audiences are split across all three. Managing chat across multiple platforms means:

- Constantly switching between browser tabs
- Missing messages, superchats, and community moments
- Paying for fragmented third-party tools that do half the job
- Copying URLs manually into OBS every broadcast
- No single source of truth for your live audience

This is a solved problem that nobody has solved cleanly.

---

## The Solution: StreamFusion

StreamFusion is a **zero-friction, multi-platform live chat aggregator** that pulls real-time chat from YouTube, Twitch, and Kick into a single unified view — with a single click, and with zero subscriptions.

Just paste a stream URL. That's it.

---

## What StreamFusion Does

### 1. Unified Combined Chat
All messages from all platforms appear in one scrolling feed, colour-coded by platform. You see your entire audience — not one third of it.

### 2. Side-by-Side Native Chat Panels
Each platform's native chat embed stays visible alongside the combined feed. Nothing is hidden. No functionality is lost.

### 3. OBS Overlay — One Click
Click **Overlay**, and StreamFusion generates a browser-source URL ready to paste directly into OBS. Your stream overlay shows combined chat from every platform in a clean, customisable panel. No OBS plugins. No RTMP tricks.

### 4. Screen-Always-On
StreamFusion uses the browser Wake Lock API to keep your display active during broadcasts — no more streams dying because your monitor went to sleep mid-cast.

### 5. Persistent Sessions
Your streams are remembered across sessions via localStorage. Open the app, and your last configuration is already loaded.

---

## Platform Coverage

| Platform | Chat Source | Method | Auth Required |
|----------|------------|--------|---------------|
| **Twitch** | IRC WebSocket | Direct anonymous connection | None |
| **Kick** | Pusher WebSocket | Direct via public API | None |
| **YouTube** | InnerTube API | Local proxy server | None |

All three platforms work **without any API keys, accounts, or subscriptions**.

---

## Competitive Landscape

| Feature | StreamFusion | Restream | Castaway | TwitchChat overlay tools |
|---------|-------------|---------|----------|--------------------------|
| YouTube + Twitch + Kick unified chat | ✅ | ✅ | ✅ | ❌ (Twitch only) |
| No subscription / free | ✅ | ❌ ($16–$49/mo) | ❌ ($9–$25/mo) | ✅ |
| No account required | ✅ | ❌ | ❌ | ✅ |
| OBS overlay built-in | ✅ | ✅ | ❌ | ✅ |
| Runs locally / offline-capable | ✅ | ❌ (cloud only) | ❌ (cloud only) | ✅ |
| Open source / self-hostable | ✅ | ❌ | ❌ | varies |
| Zero external dependencies | ✅ | ❌ | ❌ | ❌ |
| Native emote rendering | ✅ | ✅ | ❌ | ✅ |
| Data stays on your machine | ✅ | ❌ | ❌ | varies |

**StreamFusion's core advantage**: it is the only tool in this category that is completely free, requires no account, stores no data externally, and runs entirely on the user's own hardware.

---

## Who Needs This

### Independent Creators (Primary Market)
Multi-platform streaming is now the default for serious creators. Any creator broadcasting to more than one platform simultaneously is the direct user. There are an estimated **8–12 million active multi-platform streamers** globally as of 2024, growing 30%+ YoY as Kick continues its aggressive creator acquisition.

### Streaming Agencies & Management Companies
Agencies managing multiple talents need unified dashboards. StreamFusion's overlay and combined chat view reduce the cognitive load of managing a live broadcast.

### Esports Organisations
Tournament broadcasts routinely simulcast across YouTube and Twitch. A single moderation view across both platforms has direct operational value.

### Content Studios & Production Companies
Live production teams use OBS professionally. A browser-source overlay that requires zero recurring cost and zero external accounts fits directly into existing workflows.

---

## Revenue Model Options

### Freemium SaaS
- **Free tier**: Core functionality as-is (3 platforms, combined chat, OBS overlay)
- **Pro tier** ($5–8/month): Chat filtering, keyword alerts, viewer count aggregation, chat moderation actions, custom overlay themes, Discord/Slack bridge

### B2B Licensing
- White-label the tool for streaming platforms (Kick, new entrants) who want to offer multi-platform tools to onboard creators away from competitors
- Agency dashboards with multi-talent management and analytics

### Marketplace / Integrations
- Sell premium OBS overlay themes
- Offer a hosted cloud version (removes the need for `node server.js`) as a paid tier
- API access for developers building on top of the aggregated chat stream

---

## Technical Moat

StreamFusion is built with **zero external runtime dependencies** — pure Node.js built-ins and vanilla JavaScript. This means:

- **No supply chain risk** — no npm packages to audit, rotate, or patch
- **No vendor lock-in** — the entire stack is owned
- **Trivially deployable** — `node server.js` is the entire install process
- **Forkable baseline** — the architecture is clean enough to extend rapidly

The local proxy architecture also means **all chat data stays on the user's machine**. In a world where data privacy is a competitive differentiator, this is a genuine advantage over cloud-only competitors.

---

## Traction Potential

| Metric | Benchmark |
|--------|-----------|
| Target creator segment | 500K–1M multi-platform streamers (English-speaking) |
| Conversion rate (free → paid) | 3–5% at $6/mo = **$90K–$300K ARR at 50K active free users** |
| CAC | Near-zero (organic, open source, creator community word-of-mouth) |
| Payback period | Immediate (SaaS, no physical goods) |

---

## Why Now

1. **Kick's rise** has forced the multi-platform question. Creators who built audiences on Twitch are hedging by simulcasting to Kick and YouTube simultaneously. This trend is accelerating, not reversing.

2. **Restream's price increases** in 2023–2024 have left a gap at the low end of the market. Creators who only need chat aggregation (not full re-broadcasting) are paying $16+/month for a feature they use 20% of.

3. **OBS remains dominant** with 60%+ market share among independent streamers. Any tool that integrates natively with OBS has a distribution advantage — creators trust it, and the workflow is already established.

4. **The zero-setup bar** StreamFusion sets (`node server.js` → open browser) is lower than any cloud competitor. First-session time-to-value is under two minutes.

---

## The Ask

StreamFusion is currently a working, feature-complete MVP. The immediate next steps to take it from side project to product are:

1. **Hosted cloud version** — eliminate the `node server.js` step entirely with a deployed backend, removing the only friction point in the setup flow
2. **Overlay theme editor** — visual customisation for OBS overlays (the #1 requested feature in comparable tools)
3. **Chat moderation layer** — filter, highlight, and timeout users across platforms from one interface
4. **Mobile companion view** — read-only combined chat on phone while streaming from desktop

The core is built. The moat is real. The market is moving.

---

*StreamFusion — One chat. Every platform. Your stream.*
