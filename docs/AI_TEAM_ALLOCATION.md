# CatFi AI Team - Module Assignment & Task Allocation

> 3-person AI team task allocation by module, based on `BUSINESS_ARCHITECTURE.md` architecture.
> Each person owns specific modules end-to-end, enabling parallel vibe coding development.
> Last Updated: 2026-02-12

---

## Team Role Definition

| Role | Person | Module Ownership | Core Files |
|------|--------|-----------------|------------|
| **A - Agent Core** | TBD | Agent engine, Skills, System Prompt, Persona, Memory, HTTP Server | `src/agent/`, `skills/`, `src/memory/`, `src/server.ts` |
| **B - Recommendation & Data** | TBD | Recommendation system, News preprocessing, Data pipeline, Content processing | `src/recommendation/`, `src/data/`, `src/services/news*` |
| **C - Tools & Integration** | TBD | Tool implementation, Service layer, client_action, Testing, Deployment | `src/agent/tools/`, `src/services/`, `src/types/`, `Dockerfile` |

---

## Task Allocation Table (P0-P3 by Phase)

### P0 Phase (Week 1-2) - Core Foundation

| A - Agent Core | B - Recommendation & Data | C - Tools & Integration |
|----------------|--------------------------|------------------------|
| 1. HTTP Server Endpoint | 1. Recommendation architecture design | 1. client_action type definitions |
| `src/server.ts` | `docs/RECOMMENDATION_ARCHITECTURE.md` | `src/types/client-action.ts` |
| - `POST /api/agent/chat` | - Input/output interface definition | - `ClientAction` interface |
| - Request validation (Zod) | - Algorithm selection (content-based + collaborative) | - All 7 action types |
| - Response format (message + client_actions) | - Data flow pipeline design | - `ChatRequest` / `ChatResponse` |
| - Health check `/api/health` | | - `src/types/chat.ts` |
| | | |
| 2. ChatRequest context injection | 2. User interest profile model | 2. Tool validation & error standardization |
| `src/agent/engine.ts` update | `src/recommendation/user-profile.ts` | All `src/agent/tools/*.ts` |
| - Accept `currentPage`, `walletAddress`, `network` | - Build user vector from: | - Zod schema for every tool args |
| - Inject into system prompt context | -- Trading history (held tokens) | - Standardize error response format |
| - Language detection & response locale | -- Followed tokens | - Add timeout guard per tool call |
| | -- Browsed/liked news | - Tool call logging (success/fail/duration) |
| | -- 4D persona risk type | |
| | | |
| 3. Session management | 3. Content-based news filter | 3. Service layer error retry |
| `src/agent/session.ts` (NEW) | `src/recommendation/content-filter.ts` | `src/services/api.base.ts` update |
| - Multi-user session isolation | - Match news tokens to user portfolio | - Exponential backoff retry |
| - Per-user memory path scoping | - Token mention extraction from news | - Configurable retry count |
| - Session timeout & cleanup | - Relevance scoring algorithm | - Circuit breaker pattern |
| | | |
| 4. Cat persona prompt system | 4. Cold-start strategy | 4. Mock data for frontend |
| `src/agent/system-prompt.ts` update | `src/recommendation/cold-start.ts` | `src/mocks/` (NEW) |
| - Cat character template | - New user: trending + popular news | - Mock ChatResponse with client_actions |
| - 4D personality injection | - Decay to personalized after N interactions | - Mock each tool response |
| - Risk-based tone adjustment | - Default category distribution | - Provide to frontend team Day 3-5 |
| | | |
| 5. Memory multi-user support | 5. Recommendation API endpoint | 5. Docker containerization |
| `src/memory/` update | `src/server.ts` (shared) | `Dockerfile`, `docker-compose.yml` |
| - User-scoped MEMORY files | - `GET /api/recommend/news` | - Node.js production image |
| - Session-scoped history | - Input: userId, page, limit | - Environment config |
| - Concurrent access safety | - Output: ranked news list | - `.env.example` update |

---

### P1 Phase (Week 3-4) - Feature Completion

| A - Agent Core | B - Recommendation & Data | C - Tools & Integration |
|----------------|--------------------------|------------------------|
| 1. Persona response testing | 1. Collaborative filtering | 1. PnL calculation tool |
| Test suite for persona consistency | `src/recommendation/collab-filter.ts` | `src/agent/tools/wallet.ts` update |
| - 4D type A vs B response diff test | - User similarity by trading pattern | - `get_user_pnl` tool |
| - Risk tone validation | - "Users like you also watched" | - Calculate from tx history or backend API |
| - Multilingual persona test | - Sparse matrix factorization | - 7-day per-token PnL summary |
| | | |
| 2. pnl_report Skill | 2. Diversity & re-ranking | 2. News-to-trade linking tool |
| `skills/pnl_report/SKILL.md` (NEW) | `src/recommendation/reranker.ts` | `src/agent/tools/news.ts` update |
| - Trigger: "PnL", "profit", "loss" | - Anti echo-chamber mixing | - Extract bullish/bearish tokens from analysis |
| - Output: markdown table per token | - Category balance enforcement | - Auto-suggest OPEN_TRADE_WINDOW |
| - 7-day trend with emoji indicators | - Freshness decay weighting | - Default buy for bullish, sell for bearish |
| | | |
| 3. Conversation history summarization | 3. User feedback processing | 3. Streaming response (SSE) |
| `src/agent/history.ts` update | `src/recommendation/feedback.ts` | `src/server.ts` update |
| - 30-day summary generation (LLM) | - Swipe left = negative signal | - Server-Sent Events for chat |
| - Periodic summarization cron | - Click = positive signal | - Chunked message delivery |
| - Summary storage in MEMORY | - Weight update algorithm | - Frontend receives partial text |
| | | |
| 4. Multi-turn optimization | 4. News preprocessing pipeline | 4. Rate limiting middleware |
| `src/agent/engine.ts` | `src/data/news-processor.ts` (NEW) | `src/middleware/rate-limit.ts` (NEW) |
| - Tool call timeout control | - Sentiment scoring (-100 to 100) | - Per-user request throttle |
| - Graceful degradation on LLM error | - Token extraction from content | - Token bucket algorithm |
| - Context window management | - 1-2 sentence plain summary gen | - Configurable limits |
| | - Related token identification | |

---

### P2 Phase (Week 5) - Polish & Optimize

| A - Agent Core | B - Recommendation & Data | C - Tools & Integration |
|----------------|--------------------------|------------------------|
| 1. LLM call optimization | 1. Content category classification | 1. Swap/exchange quote tool |
| - Prompt compression | `src/data/content-classifier.ts` | `src/agent/tools/trade.ts` update |
| - Response caching for repeated queries | - educational / tradable / macro | - `get_swap_quote` tool |
| - Token usage monitoring | - Multi-label classification | - Show estimated receive amount |
| | - Training data preparation | - Slippage impact preview |
| | | |
| 2. Cat House memory display API | 2. Data quality monitoring | 2. Trade simulation preview |
| `src/server.ts` endpoint | `src/data/quality-monitor.ts` | - `SHOW_TRADE_SIMULATION` client_action |
| - `GET /api/memory/summary` | - Duplicate detection | - Estimated gas fee |
| - Return interaction highlights | - Stale content cleanup | - Expected execution price |
| - Conversation key moments | - Coverage metrics dashboard | - Impact analysis |
| | | |
| 3. Quick action suggestion engine | 3. Embedding-based semantic ranking | 3. API response caching layer |
| - Context-aware button suggestions | (Optional, if embedding infra ready) | `src/services/cache.ts` (NEW) |
| - "Analyze my BTC" on asset page | - Semantic similarity for news matching | - In-memory cache with TTL |
| - "Buy more" for positive PnL tokens | - Vector store integration | - Cache invalidation strategy |
| | | - High-frequency API caching |

---

### P3 Phase (Week 6) - Testing & Integration

| A - Agent Core | B - Recommendation & Data | C - Tools & Integration |
|----------------|--------------------------|------------------------|
| 1. Agent performance optimization | 1. Recommendation stability test | 1. Full E2E test suite |
| - P95 response time < 3s target | - Feed consistency validation | `test/e2e/` (NEW) |
| - Concurrent session load test | - Cold-start → warm transition test | - Complete trade flow test |
| - Memory leak detection | - Edge cases (no news, no history) | - Asset analysis flow test |
| | | - News query flow test |
| | | |
| 2. Frontend chat API integration | 2. Recommendation API frontend integration | 2. Frontend card API integration |
| - Debug with frontend chat UI | - Debug with frontend news feed | - Debug with frontend trade modals |
| - Adjust response format as needed | - Adjust ranking parameters | - Adjust client_action params |
| - Fix edge cases from real usage | - A/B test preparation | - Fix UI mismatch issues |
| | | |
| 3. Edge case handling | 3. Data pipeline monitoring | 3. Deployment & monitoring |
| - Malicious input defense | - Processing latency alerts | - Production deployment script |
| - Token overflow protection | - Data freshness monitoring | - Structured logging setup |
| - Graceful fallback for all skills | - Error rate dashboard | - Health check & alerting |
| | | - Rollback procedure doc |

---

## Module Dependency Graph

```
C (Types/client_action) ──→ A (Engine uses types) ──→ A (Skills use engine)
                                    ↓
C (Service Layer) ──→ C (Tools use services) ──→ A (Engine calls tools)
                                    ↓
B (Recommendation) ──→ C (API endpoint in server.ts)
                                    ↓
B (Data Pipeline) ──→ B (Recommendation uses processed data)
```

### Critical Path & Blocking Dependencies

| Blocked Task | Depends On | Owner |
|-------------|-----------|-------|
| A: Context injection | C: `ChatRequest` type definition | C must finish types first |
| A: Persona injection | Backend: `/profiles/profile` with 4D data | Backend team |
| B: User profile | C: Tools that fetch trade history, holdings | C must have tools working |
| B: Recommendation API | A: Server.ts base setup | A sets up Express/Fastify first |
| C: Mock data | A: Response format definition | A defines format, C creates mocks |

### Recommended Kickoff Order (Day 1)

1. **C** starts with `src/types/client-action.ts` + `src/types/chat.ts` (30 min) → unblocks A
2. **A** starts with `src/server.ts` Express setup (2 hours) → unblocks B's API endpoint
3. **B** starts with `docs/RECOMMENDATION_ARCHITECTURE.md` design doc (Day 1-2)
4. All three work in parallel after Day 1 foundation

---

## File Ownership Matrix

> Each person is the **primary owner** of their files. Cross-module changes require a quick sync.

| Directory / File | Owner | Reviewer |
|-----------------|-------|----------|
| `src/server.ts` | A (setup) + B (rec endpoint) + C (mock) | All |
| `src/agent/engine.ts` | A | C |
| `src/agent/system-prompt.ts` | A | B |
| `src/agent/skills.ts` | A | C |
| `src/agent/session.ts` | A | C |
| `src/agent/history.ts` | A | B |
| `src/agent/context-assembler.ts` | A | C |
| `src/agent/tools/*.ts` | C | A |
| `src/services/*.ts` | C | A |
| `src/types/*.ts` | C | A |
| `src/memory/` | A | C |
| `src/recommendation/` | B | A |
| `src/data/` | B | C |
| `src/middleware/` | C | A |
| `src/mocks/` | C | A |
| `skills/*.md` | A | B |
| `test/` | C (infra) + All (own modules) | All |
| `Dockerfile` | C | A |
| `docs/` | All (own sections) | All |

---

## Weekly Sync Protocol

| Day | Activity | Participants |
|-----|----------|-------------|
| Monday AM | Weekly sprint planning, blocker check | A + B + C |
| Wednesday PM | Mid-week demo & sync (show progress) | A + B + C |
| Friday PM | Week review, merge all branches, integration test | A + B + C |
| Daily | Async standup in team chat (done / doing / blocked) | A + B + C |
