# AI Chat v2 — Unified Plan (Cloudflare Workers, AI SDK v5, GPT-5, local-only, single sidebar thread)

## Objectives
- Cursor-style sidebar chat that persists across navigation.
- Streams replies from **OpenAI GPT-5** (via `@ai-sdk/openai`) behind your Worker route.
- Uses **current page context** by default, can pull **full page text** on demand.
- Tools: **page.context**, **mcp.search**, **docs.search**.
- **Local-only storage**: one chat thread in the browser; no server DB.

---

## Architecture (recommended: merged repo)
Single codebase for docs + API. Simpler types, fewer moving parts, faster POC.

app/
  api/ai/route.(ts|js)       ← AI route (Workers/Pages Function) using AI SDK Core streamText + tools
  (docs)/                    ← Fumadocs content (.md/.mdx)
  components/ChatSidebar.tsx ← Sidebar UI (AI SDK UI useChat)
  ai/tools.(ts|js)           ← Zod-typed tools: page.context, mcp.search, docs.search
  lib/page-context.(ts|js)   ← Helpers to collect light context (url, docId, title, headings)
  lib/local-store.(ts|js)    ← LocalStorage helpers (load/save/prune UIMessage[])

Secrets live in Cloudflare env; safe for open source.

### Alternative: split repos (frontend + backend)
- Frontend uses `useChat({ api: 'https://<backend>/api/ai' })`.
- Backend exposes the same streamText + tools.
- Trade-off: more CORS/version friction, you lose co-located types.

---

## Providers & Models
- **OpenAI** via `@ai-sdk/openai`, `openai('gpt-5')`.
- Optional later: Cloudflare **AI Gateway** in front of OpenAI for routing/analytics.
- Optional later: Workers AI via `workers-ai-provider` if you want on-Cloudflare models.

---

## Message Shape (v5 best practice)
Define one typed **UIMessage** for client+server. Include doc metadata.

type DocContext = { url: string; docId: string; title?: string; headings?: string[] }
type AppMessage = UIMessage<{ doc?: DocContext }>

Rationale: full-stack type safety; clean tool traces; consistent persistence.

---

## Tools
1) page.context
   - input: { docId | url }
   - return: bounded text slices of the current doc (chunked, token-budgeted)
   - policy: never dump entire page by default; fetch on demand

2) mcp.search
   - input: { query, docId?, url? }
   - call your MCP HTTP/SSE endpoint
   - return: [{ title, url, snippet, score }...]

3) docs.search (non-MCP)
   - input: { query, docId?, url? }
   - hits your existing search API
   - return: same shape as mcp.search for uniform rendering

Implementation notes:
- Zod-validate inputs; strict timeouts; cap payload sizes.
- If long-running, return partials and tell the model to “continue”.

---

## Context Strategy
- Every user send includes **light context**: { url, docId, title, 3–6 headings }.
- The model calls **page.context** if it needs full text slices.
- For long docs, chunk by headings/paragraphs and rank top-K segments.

---

## Sidebar UX
- Fixed right dock; toggle via FAB.
- Persists across navigation (mount in root layout).
- One chat only: id = "sidebar".
- Show small “Sources” list for tool URLs; “Ask this page” button injects selection.

---

## Persistence (local-only)
- Store **UIMessage[]** in **localStorage** keyed by "chat:sidebar".
- On mount: hydrate from localStorage; on finish/stream end: write back.
- Cap total size (~150–250 KB). If exceeded:
  - Ask model for a short “conversation summary” system note, keep it, drop oldest turns.

Caveats:
- No stream resume after tab crash (acceptable for POC).
- Clear chat button wipes localStorage key.

---

## Security & Ops
- Only server calls hold secrets (OPENAI_API_KEY in Workers env).
- Rate limit `/api/ai` by IP/session.
- Validate messages/tools; reject oversized inputs; sanitize HTML.
- Log tool inputs/outputs (without PII) for debugging.

---

## Model & Generation Settings (initial)
- model: gpt-5
- max output tokens: short (sidebar answers)
- tool parallelism: off initially
- system instructions: brief; prefer page.context first, then mcp.search/docs.search; cite URLs returned by tools

---

## File Map (merged)
app/
  api/ai/route.ts        [NEW] streamText + tools, returns UIMessage stream
  (docs)/...             [EXISTING] .md/.mdx content
  components/
    ChatSidebar.tsx      [NEW] useChat + local storage glue
    ChatFAB.tsx          [NEW]
    ChatMessage.tsx      [NEW]
  ai/
    tools.ts             [NEW] page.context, mcp.search, docs.search (Zod)
    message-types.ts     [NEW] AppMessage + DocContext
  lib/
    page-context.ts      [NEW] extract url/docId/title/headings
    local-store.ts       [NEW] load/save/prune UIMessage[]

### Split variant (if you refuse to merge)
frontend/
  app/api/ai/route.ts    [NEW] proxy to backend (CORS/auth)
backend/
  src/chat-handler.ts    [NEW] streamText + tools
  src/tools.ts           [NEW]
  src/index.ts           [MOD] add /api/ai route

---

## Rollout
1) Backend route working with curl (streams).
2) Minimal sidebar wired to route (streams visible).
3) Add light page context on each send.
4) Implement page.context tool (bounded slices).
5) Wire mcp.search + docs.search tools.
6) Add local storage persistence + pruning.
7) Ship to staging; verify rate limits and errors.
8) Ship to prod.

---

## Testing
- Streaming under flaky networks.
- Context injection correctness (slug/title/headings).
- Tool calls: latency caps + error paths.
- Local storage prune behavior and “clear chat”.
- Mobile layout (sidebar = full-width drawer).

---

## TODOs

Setup
- [x] Add `ai`, `@ai-sdk/openai`, `zod` to the docs app.
- [ ] Configure `OPENAI_API_KEY` in Cloudflare (no secrets in git).

Server (Workers/Pages Function)
- [x] Create `src/app/api/ai/route.ts` with `streamText(openai('gpt-5'), { messages, tools })`.
- [ ] Implement Zod validation for incoming `AppMessage[]`.
- [x] Implement tools in `ai/tools.ts`:
      - [x] page.context (basic - chunk/cap/rank to be refined)
      - [x] mcp.search (HTTP/SSE, compact results)
      - [x] docs.search (HTTP, compact results)
- [ ] Add rate limiting + basic input size checks.

Client
- [x] Build `ChatSidebar.tsx` with `useChat({ id: 'sidebar', api: '/api/ai' })`.
- [x] Implement `local-store.ts` (hydrate/save/prune on finish).
- [x] Extract page metadata in `page-context.ts`; include with each send.
- [x] Add FAB; add "Clear chat" button.
- [ ] Make FAB icon smaller (Intercom-style size).
- [ ] Add Cmd+I keyboard shortcut to toggle chat.
- [ ] Add Esc key to close chat when open.
- [ ] Make Cmd+K search menu and AI chat mutually exclusive (opening one closes the other).
- [ ] Render sources panel when tool URLs present.

Content & Prompt
- [x] Keep system instructions short; require citing tool URLs.
- [ ] Add "Ask this page" button to prefill selection + title.

Testing
- [ ] Test streaming and tool calling end-to-end.
- [ ] Verify localStorage persistence works correctly.
- [ ] Test on mobile (sidebar = full-width drawer).

Polish (nice-to-have after POC)
- [ ] Syntax highlight + copy buttons for code.
- [ ] Tiny transcripts panel with "from: page / search" chips.
- [x] Thumbs up/down to your existing `/api/feedback`.
- [ ] Polish UI with shadcn/AI SDK components where appropriate.
- [ ] Adjustable sidebar width (save for end with other polish/qol).

Docs
- [ ] README section: local-only storage caveats, how to clear.
- [ ] Note: one chat id ("sidebar") by design; multi-thread is out of scope.

---

## Open questions (please answer)
1) Repo: OK to **merge** now for the POC? If not, confirm you want to stay **split** for the first ship.
- yes
2) GPT-5 snapshot: which exact model id should we pin (e.g., `gpt-5-2025-xx-xx`)?
- no snapshot
3) MCP endpoint: confirm base URL(s) and whether they support **SSE**; any CORS constraints?
- https://mcp.superwall.com/sse
4) Fumadocs runtime: are pages on **Cloudflare Pages Functions** (vs raw Workers) so the route is `/app/api/ai`?
- cloudflare workers
5) Size limits: cap per `page.context` response (e.g., ~3–5k tokens). Acceptable?
- don't cap for now
6) Any CSP headers that would block `fetch`/SSE from the sidebar on your domain?
- i don't think so?