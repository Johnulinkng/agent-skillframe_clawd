# CatFi V2 - AI/Agent & Recommendation System Task Breakdown

> Based on V2 product requirements, BUSINESS_ARCHITECTURE.md architecture, and current implementation status.
> Last Updated: 2026-02-12

---

## Task Status Legend

| Symbol | Meaning |
|--------|---------|
| DONE | Already implemented in current codebase |
| TODO | Not yet started |
| PARTIAL | Partially implemented, needs completion |

---

## 1. AI Chat Core (P0)

> Module: AI | Related Page: Cat House (AI Chat)

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 1.1 | AI Chat | Expose HTTP endpoint `POST /api/agent/chat` for frontend | P0 | AI | TODO | `src/server.ts` (NEW) |
| 1.2 | AI Chat | Define ChatRequest/ChatResponse TypeScript interfaces | P0 | AI | TODO | `src/types/chat.ts` (NEW) |
| 1.3 | AI Chat | Define `ClientAction` type system (OPEN_TRADE_WINDOW, CONFIRM_TRANSACTION, NAVIGATE, etc.) | P0 | AI | TODO | `src/types/client-action.ts` (NEW) |
| 1.4 | AI Chat | Accept frontend context params (currentPage, walletAddress, network, locale) and inject into Agent | P0 | AI | TODO | `src/agent/engine.ts` update |
| 1.5 | AI Chat | Session ID management for multi-user concurrent conversations | P0 | AI | TODO | `src/agent/session.ts` (NEW) |
| 1.6 | AI Chat | Mock response data for frontend development before real LLM integration | P0 | AI | TODO | `src/server.ts` |
| 1.7 | AI Chat | Request parameter validation (Zod schema) | P0 | AI | TODO | `src/server.ts` |
| 1.8 | AI Chat | Error response format standardization | P0 | AI | PARTIAL | `src/agent/engine.ts` |
| 1.9 | AI Chat | Agent multi-turn conversation loop | P0 | AI | DONE | `src/agent/engine.ts` |
| 1.10 | AI Chat | Tool Registry and dynamic tool loading | P0 | AI | DONE | `src/agent/tools.ts` |
| 1.11 | AI Chat | Skill Loader with eligibility check (requires_env) | P0 | AI | DONE | `src/agent/skills.ts` |
| 1.12 | AI Chat | Context Assembler (system prompt + memory + history) | P0 | AI | DONE | `src/agent/context-assembler.ts` |
| 1.13 | AI Chat | System Prompt Builder | P0 | AI | DONE | `src/agent/system-prompt.ts` |
| 1.14 | AI Chat | LLM Provider abstraction (Qwen/OpenAI) | P0 | AI | DONE | `src/providers/index.ts` |

---

## 2. Cat Persona System (P0)

> Module: AI | Related Page: Cat House (AI Chat), All Pages

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 2.1 | Cat Persona | Build persona prompt template (cat character definition, tone, catchphrases) | P0 | AI | PARTIAL | `src/agent/system-prompt.ts` |
| 2.2 | Cat Persona | Integrate user 4D personality type into system prompt | P0 | AI | TODO | System prompt context injection |
| 2.3 | Cat Persona | Adjust response style based on user risk tolerance (conservative/aggressive) | P1 | AI | TODO | Persona prompt logic |
| 2.4 | Cat Persona | Test and validate persona consistency across different query types | P1 | AI | TODO | Test cases |

---

## 3. Trading Assistant (P0)

> Module: AI | Related Page: Asset Page, Token Page, Contract Page

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 3.1 | Trade | `check_usdc_balance` tool - check USDC balance before trade | P0 | AI | DONE | `src/agent/tools/trade.ts` |
| 3.2 | Trade | `create_trade_intent` tool - return OPEN_TRADE_WINDOW client_action | P0 | AI | DONE | `src/agent/tools/trade.ts` |
| 3.3 | Trade | `get_transaction_settings` tool - gas/slippage settings | P0 | AI | DONE | `src/agent/tools/trade.ts` |
| 3.4 | Trade | `sign_and_send_transaction` tool - return CONFIRM_TRANSACTION client_action | P0 | AI | DONE | `src/agent/tools/trade.ts` |
| 3.5 | Trade | `trade_helper` Skill - full trade flow with balance check first | P0 | AI | DONE | `skills/trade_helper/SKILL.md` |
| 3.6 | Trade | `deposit_reminder` Skill - prompt deposit when USDC insufficient, return OPEN_DEPOSIT action | P0 | AI | DONE | `skills/deposit_reminder/SKILL.md` |
| 3.7 | Trade | Contract/perpetual trading support in `create_trade_intent` | P0 | AI | DONE | `src/agent/tools/trade.ts` |
| 3.8 | Trade | Swap/exchange quote display (show estimated received amount) | P1 | AI | TODO | New tool or extend `create_trade_intent` |
| 3.9 | Trade | Simulated trade result preview before execution | P2 | AI | TODO | New `SHOW_TRADE_SIMULATION` client_action |
| 3.10 | Trade | Batch position adjustment (DeFi protocol fund transfer) | P3 | AI | TODO | Future phase |

---

## 4. Asset Analysis (P0)

> Module: AI | Related Page: Asset Page, Token Page

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 4.1 | Asset Dashboard | `get_wallet_balance` tool - query single token balance | P0 | AI | DONE | `src/agent/tools/wallet.ts` |
| 4.2 | Asset Dashboard | `get_holding_list` tool - query all holdings | P0 | AI | DONE | `src/agent/tools/wallet.ts` |
| 4.3 | Asset Dashboard | `get_tx_history` tool - transaction history | P0 | AI | DONE | `src/agent/tools/wallet.ts` |
| 4.4 | AI Asset Diagnosis | `asset_analyst` Skill - portfolio analysis with markdown table output | P0 | AI | DONE | `skills/asset_analyst/SKILL.md` |
| 4.5 | AI Asset Diagnosis | Include spot + contract positions in analysis | P0 | AI | PARTIAL | Skill needs contract position data |
| 4.6 | Token Detail | `get_token_price` / `get_token_detail` tools | P0 | AI | DONE | `src/agent/tools/market.ts` |
| 4.7 | Token Detail | `get_token_kline` tool - price chart data | P0 | AI | DONE | `src/agent/tools/market.ts` |
| 4.8 | Token Detail | `search_token` tool - search by keyword | P0 | AI | DONE | `src/agent/tools/market.ts` |
| 4.9 | PnL Report | 7-day PnL per token calculation/display | P1 | AI + Backend | TODO | Needs backend API or local calculation |
| 4.10 | PnL Report | `pnl_report` Skill - PnL summary with markdown table | P1 | AI | TODO | `skills/pnl_report/SKILL.md` (NEW) |

---

## 5. News Intelligence (P1)

> Module: AI | Related Page: Discovery Page

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 5.1 | News Card | `get_topic_list` tool - fetch news topic list | P1 | AI | DONE | `src/agent/tools/topic.ts` |
| 5.2 | News Card | `get_topic_detail` tool - single news detail | P1 | AI | DONE | `src/agent/tools/topic.ts` |
| 5.3 | News Card | `get_ai_analysis` tool - AI news analysis report | P1 | AI | DONE | `src/agent/tools/news.ts` |
| 5.4 | News Card | `check_token_security` tool - token security check | P1 | AI | DONE | `src/agent/tools/news.ts` |
| 5.5 | News Card | `news_digest` Skill - news retrieval with cat-style commentary | P1 | AI | DONE | `skills/news_digest/SKILL.md` |
| 5.6 | News Card | Link news analysis to quick trade action (bullish = default buy, bearish = default sell) | P1 | AI | TODO | Extend `news_digest` skill + client_action |
| 5.7 | News Card | Generate 1-2 sentence plain-language summary for each news card | P1 | AI | TODO | Backend preprocessing or Agent tool |
| 5.8 | News Detail | Related token identification from news content | P1 | AI | TODO | Backend preprocessing or Agent tool |
| 5.9 | News Detail | Sentiment scoring (-100 to 100) for related tokens | P1 | AI | TODO | Backend preprocessing or Agent tool |

---

## 6. Recommendation System (P0)

> Module: AI | Related Page: Discovery Page (News Cards)

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 6.1 | Recommendation | Design recommendation algorithm architecture (X-style personalized feed) | P0 | AI | TODO | `docs/RECOMMENDATION_ARCHITECTURE.md` (NEW) |
| 6.2 | Recommendation | User interest profiling from trading history + viewed news + liked news | P0 | AI | TODO | `src/recommendation/user-profile.ts` (NEW) |
| 6.3 | Recommendation | Content-based filtering: match news tokens to user held/followed tokens | P0 | AI | TODO | `src/recommendation/content-filter.ts` (NEW) |
| 6.4 | Recommendation | Collaborative filtering: similar user behavior patterns | P1 | AI | TODO | `src/recommendation/collab-filter.ts` (NEW) |
| 6.5 | Recommendation | Time-decay weighting (recent news higher priority) | P0 | AI | TODO | Scoring function |
| 6.6 | Recommendation | Diversity injection (avoid news echo chamber, mix categories) | P1 | AI | TODO | Re-ranking logic |
| 6.7 | Recommendation | API endpoint `GET /api/recommend/news` for frontend news feed | P0 | AI | TODO | `src/server.ts` |
| 6.8 | Recommendation | User feedback loop: swipe left (not interested) reduces similar content weight | P1 | AI | TODO | Feedback processing |
| 6.9 | Recommendation | A/B testing framework for recommendation strategies | P2 | AI | TODO | Future phase |
| 6.10 | Recommendation | Cold-start strategy for new users (popular/trending as default) | P0 | AI | TODO | Fallback logic |

---

## 7. Memory & Context System (P0)

> Module: AI | Related Page: Cat House (Chat Memory)

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 7.1 | Memory | LiteMemoryManager - local file-based memory | P0 | AI | DONE | `src/memory/lite-manager.ts` |
| 7.2 | Memory | `memory_search` / `memory_get` tools | P0 | AI | DONE | `src/agent/tools/memory.ts` |
| 7.3 | Memory | Short-term memory: 1-day chat history as context | P0 | AI | DONE | `src/agent/history.ts` |
| 7.4 | Memory | Long-term memory: 30-day chat summary (compact) | P1 | AI | PARTIAL | MEMORY.md exists, summarization logic TODO |
| 7.5 | Memory | Cat House "interaction memory" display (past conversations, preferences) | P1 | AI | TODO | API endpoint to retrieve memory |
| 7.6 | Memory | Per-user isolated memory storage (multi-user support) | P1 | AI | TODO | User-scoped memory paths |

---

## 8. Service Layer - API Integration (P0)

> Module: AI | Infrastructure

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 8.1 | API Layer | BaseApiService with auth, timeout, error handling | P0 | AI | DONE | `src/services/api.base.ts` |
| 8.2 | API Layer | WalletService | P0 | AI | DONE | `src/services/wallet.service.ts` |
| 8.3 | API Layer | TransactionService | P0 | AI | DONE | `src/services/transaction.service.ts` |
| 8.4 | API Layer | MarketService | P0 | AI | DONE | `src/services/market.service.ts` |
| 8.5 | API Layer | TokenService | P0 | AI | DONE | `src/services/token.service.ts` |
| 8.6 | API Layer | NewsService | P0 | AI | DONE | `src/services/news.service.ts` |
| 8.7 | API Layer | SecurityService | P0 | AI | DONE | `src/services/security.service.ts` |
| 8.8 | API Layer | TopicService | P0 | AI | DONE | `src/services/topic.service.ts` |
| 8.9 | API Layer | ContractService | P0 | AI | DONE | `src/services/contract.service.ts` |
| 8.10 | API Layer | UserService | P0 | AI | DONE | `src/services/user.service.ts` |
| 8.11 | API Layer | PointService | P1 | AI | DONE | `src/services/point.service.ts` |
| 8.12 | API Layer | CommonService | P1 | AI | DONE | `src/services/common.service.ts` |
| 8.13 | API Layer | SearchService | P1 | AI | DONE | `src/services/search.service.ts` |
| 8.14 | API Layer | Error retry with exponential backoff | P1 | AI | TODO | `src/services/api.base.ts` update |
| 8.15 | API Layer | API response caching (high-frequency queries) | P2 | AI | TODO | Cache layer |

---

## 9. Gamification (Cat House) (P1)

> Module: AI | Related Page: Cat House

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|---- ----|--------|-------|
| 9.1 | Check-in | `check_in` tool | P1 | AI | DONE | `src/agent/tools/user.ts` |
| 9.2 | Tasks | `get_task_list` / `claim_task_reward` tools | P1 | AI | DONE | `src/agent/tools/user.ts` |
| 9.3 | Profile | `get_user_profile` tool | P1 | AI | DONE | `src/agent/tools/user.ts` |
| 9.4 | Cat Dashboard | Cat mood/expression based on interaction frequency | P2 | AI | TODO | Future phase |

---

## 10. Deployment & Operations (P0)

> Module: AI | Infrastructure

| # | V2 Feature | Detailed Task | Priority | Module | Status | Files |
|---|-----------|---------------|----------|--------|--------|-------|
| 10.1 | Deploy | Containerize Agent service (Docker) | P0 | AI | TODO | `Dockerfile` (NEW) |
| 10.2 | Deploy | Environment configuration (.env management) | P0 | AI | PARTIAL | `.env.example` exists |
| 10.3 | Deploy | Health check endpoint `/api/health` | P0 | AI | TODO | `src/server.ts` |
| 10.4 | Deploy | Agent response time monitoring | P1 | AI | TODO | Metrics middleware |
| 10.5 | Deploy | Tool call success rate logging | P1 | AI | TODO | Structured logging |
| 10.6 | Deploy | Streaming response support (SSE) | P1 | AI | TODO | `src/server.ts` |
| 10.7 | Deploy | Rate limiting per user | P1 | AI | TODO | Middleware |

---

## Summary Statistics

| Category | Total Tasks | DONE | TODO | PARTIAL |
|----------|------------|------|------|---------|
| 1. AI Chat Core | 14 | 6 | 7 | 1 |
| 2. Cat Persona | 4 | 0 | 3 | 1 |
| 3. Trading Assistant | 10 | 7 | 3 | 0 |
| 4. Asset Analysis | 10 | 8 | 2 | 0 |
| 5. News Intelligence | 9 | 5 | 4 | 0 |
| 6. Recommendation | 10 | 0 | 10 | 0 |
| 7. Memory & Context | 6 | 3 | 2 | 1 |
| 8. Service Layer | 15 | 13 | 2 | 0 |
| 9. Gamification | 4 | 3 | 1 | 0 |
| 10. Deployment | 7 | 0 | 6 | 1 |
| **Total** | **89** | **45** | **40** | **4** |

**Overall Completion: ~50% (45/89 tasks done)**

---

## Priority Execution Order

### Immediate (Week 1-2): P0 TODO Items
1. **1.1-1.7**: HTTP endpoint + types + session management (Agent Chat foundation)
2. **2.1-2.2**: Cat persona prompt + 4D integration
3. **6.1-6.3, 6.5, 6.7, 6.10**: Recommendation system core (architecture + content-filter + API + cold-start)
4. **10.1-10.3**: Deployment basics (Docker + health check)

### Short-term (Week 3-4): P1 TODO Items
5. **4.9-4.10**: PnL report skill
6. **5.6-5.9**: News-to-trade linking
7. **6.4, 6.6, 6.8**: Recommendation enhancements
8. **7.4-7.6**: Memory system completion
9. **10.4-10.7**: Operations tooling

### Later (Week 5+): P2-P3 Items
10. **3.8-3.10**: Advanced trading features
11. **6.9**: A/B testing
12. **8.14-8.15**: API retry + caching
13. **9.4**: Cat dashboard
