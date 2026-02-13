# CatFi AI Agent - API Integration Specification & Team Division

> This document defines the client_action protocol, all required API interfaces, frontend/backend responsibilities, and the current agent capability gap analysis.

---

## 1. Trade Execution Architecture: Why Client-Side?

### 1.1 Problem

The AI Agent (backend) **cannot** and **should not** directly sign and broadcast on-chain transactions. Reasons:

| Concern | Why Client-Side |
|---------|----------------|
| **Private Key Security** | User's private key lives in their wallet (MetaMask, Privy embedded wallet). The backend never has access. |
| **User Consent** | Every trade must be explicitly confirmed by the user. Regulations and Web3 norms require this. |
| **Liability** | If the AI executes a bad trade autonomously, there is legal and financial liability. |
| **Industry Standard** | All major DeFi frontends (Uniswap, Jupiter, 1inch) use the pattern: **backend prepares, frontend executes**. |

### 1.2 Recommended Architecture: Intent-Action Pattern

This is the **industry-standard** pattern used by AI-powered Web3 products (e.g., Fini, DODO X, Matcha):

```
User ---(natural language)---> Frontend ---(API call)---> AI Agent Backend
                                                              |
                                                        [LLM reasoning]
                                                        [Tool execution]
                                                              |
AI Agent Backend ---(response with client_action)---> Frontend
                                                              |
                                                     [Parse client_action]
                                                     [Show confirmation UI]
                                                              |
User ---(confirm/reject)---> Frontend ---(wallet sign)----> Blockchain
```

**Core Principle**: The AI Agent returns an **intent** (what it wants the frontend to do), not the execution itself.

### 1.3 client_action Protocol Definition

Every AI Agent response may contain zero or more `client_action` objects. Frontend must parse these from the response and render appropriate UI.

```typescript
// Defined in: src/types/client-action.ts

interface AgentResponse {
    message: string;           // Text response (always present)
    client_actions?: ClientAction[];  // Optional action directives
}

interface ClientAction {
    type: string;              // Action type enum (see table below)
    params: Record<string, any>;  // Action-specific parameters
    display?: {                // Optional display hints
        label?: string;        // Button label
        style?: 'primary' | 'warning' | 'danger';
        icon?: string;
    };
}
```

### 1.4 Action Type Registry

| type | Description | params | Frontend Behavior |
|------|-------------|--------|-------------------|
| `OPEN_TRADE_WINDOW` | Open spot/contract trade panel | `{ symbol, side, tradeType, network, amount?, price? }` | Open trade modal with pre-filled params |
| `CONFIRM_TRANSACTION` | Show tx confirmation dialog | `{ network, from, to, value, data?, gasPrice?, gasLimit?, description }` | Show confirmation modal, user approves -> call Privy sign |
| `NAVIGATE` | Navigate to a page | `{ path, query? }` | `router.push(path)` |
| `OPEN_DEPOSIT` | Open deposit/buy USDC page | `{ network?, amount? }` | Navigate to deposit page |
| `SHOW_CHART` | Display token price chart | `{ symbol, network, interval? }` | Render chart component |
| `SHOW_TABLE` | Display structured data table | `{ title, headers, rows }` | Render markdown/custom table |
| `QUICK_ACTIONS` | Show clickable action buttons | `{ buttons: [{label, action, params}] }` | Render action button group |

---

## 2. Required Backend APIs (For the Backend Team)

> Base URL: `http://tbo.mydex.io/app-api`
> Auth: `Authorization: Bearer <JWT>`

The AI Agent needs these APIs to function. This section lists **what the Agent needs** and maps to existing endpoints where available.

### 2.1 User & Profile APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 1 | `/profiles/profile` | GET | User profile, 4D persona, preferences | `get_user_profile` | EXISTS |
| 2 | `/auth/profile` | GET | Auth user info | (internal auth) | EXISTS |

**Required Response for `/profiles/profile`** (Agent needs these fields):
```json
{
    "code": 200,
    "data": {
        "userId": "string",
        "nickname": "string",
        "avatar": "string",
        "persona4D": {
            "type": "string",
            "description": "string",
            "riskTolerance": "low|medium|high",
            "tradingStyle": "string"
        },
        "language": "zh|en",
        "defaultNetwork": "string",
        "walletAddress": "string"
    }
}
```

> [!IMPORTANT]
> If `/profiles/profile` does not return 4D persona data (`persona4D`), the backend team needs to add this field. The Agent relies on it for personalized responses.

---

### 2.2 Wallet & Asset APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 3 | `/wallet/token/balance` | GET | Single token balance | `get_wallet_balance`, `check_usdc_balance` | EXISTS |
| 4 | `/wallet/token/holding` | GET | All holdings list | `get_holding_list` | EXISTS |
| 5 | `/wallet/token/holdingPage` | GET | Paginated holdings | (same tool, paginated) | EXISTS |
| 6 | `/wallet/token/tx/history` | GET | Transaction history | `get_tx_history` | EXISTS |

**Required Query Params for `/wallet/token/balance`**:
```
walletAddress (required): string   - User wallet address
network (required): string         - Chain network (ethereum/bsc/solana/base...)
tokenAddress (optional): string    - Token contract address (omit for native coin)
```

---

### 2.3 Market Data APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 7 | `/market/token/detail` | GET | Token market detail | `get_token_detail` | EXISTS |
| 8 | `/market/token/24h` | GET | 24h price change | `get_token_price` | EXISTS |
| 9 | `/market/token/kline` | GET | K-line chart data | `get_token_kline` | EXISTS |
| 10 | `/market/token/pools` | GET | Liquidity pools | (internal) | EXISTS |
| 11 | `/market/token/tradeLatest` | GET | Recent trades | (internal) | EXISTS |
| 12 | `/token/dex/search` | GET | Search tokens by keyword | `search_token` | EXISTS |
| 13 | `/token/hot` | GET | Hot/trending tokens | `get_hot_tokens` | EXISTS |
| 14 | `/token/follow` | GET | User followed tokens | `get_followed_tokens` | EXISTS |
| 15 | `/token/follow` | POST | Follow a token | `follow_token` | EXISTS |
| 16 | `/token/warning/list` | GET | Token risk warnings | `get_token_warnings` | EXISTS |

---

### 2.4 News & Analysis APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 17 | `/topic` | GET | Topic/news list | `get_topic_list` | EXISTS |
| 18 | `/topic/detail/{id}` | GET | Topic detail | `get_topic_detail` | EXISTS |
| 19 | `/topic/following` | GET | Followed topics | (internal) | EXISTS |
| 20 | `/topic/follow/{id}` | POST | Follow topic | `follow_topic` | EXISTS |
| 21 | `/topic/history` | GET | Browsing history | (future) | EXISTS |
| 22 | `/collection/ai_analyst` | POST | AI news analysis | `get_ai_analysis` | EXISTS |
| 23 | `/collection/ai_order` | POST | AI trade from news | `create_ai_order` | EXISTS |
| 24 | `/security/token_security` | POST | Token security check | `check_token_security` | EXISTS |

---

### 2.5 Trading APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 25 | `/transaction/settings` | GET | Gas/slippage config | `get_transaction_settings` | EXISTS |
| 26 | `/transaction/settings` | POST | Modify trade config | (internal) | EXISTS |
| 27 | `/privy/sign-and-send-transaction` | POST | Sign & send tx | `sign_and_send_transaction` | EXISTS |
| 28 | `/collection/tx/send` | POST | Send raw transaction | (internal) | EXISTS |

> [!WARNING]
> **Critical Architecture Decision**: The `create_trade_intent` tool does NOT call any backend API. It returns a `client_action` of type `OPEN_TRADE_WINDOW` for the frontend to handle. The actual signing happens when the user confirms, and then the frontend calls `/privy/sign-and-send-transaction`.

---

### 2.6 Contract (Perpetual) Trading APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 29 | `/contract/detail/{coinName}` | GET | Contract detail | (via contract.service) | EXISTS |
| 30 | `/contract/list` | GET | Contract list | (via contract.service) | EXISTS |
| 31 | `/contract/hot` | GET | Hot contracts | (via contract.service) | EXISTS |
| 32 | `/contract/candle` | GET | Contract K-line | (via contract.service) | EXISTS |
| 33 | `/contract/l2book` | GET | Order book | (via contract.service) | EXISTS |
| 34 | `/market/contract/detail/{coinName}` | GET | Contract market detail | (via market.service) | EXISTS |

---

### 2.7 Points & Gamification APIs

| # | Endpoint | Method | Purpose | Agent Tool | Status |
|---|----------|--------|---------|------------|--------|
| 35 | `/pointTask/checkIn` | POST | Daily check-in | `check_in` | EXISTS |
| 36 | `/pointTask/getTaskSummaryList` | GET | Task list | `get_task_list` | EXISTS |
| 37 | `/pointTask/claimPointReward` | POST | Claim reward | `claim_task_reward` | EXISTS |
| 38 | `/pointTask/getCheckInData` | GET | Check-in history | (internal) | EXISTS |

---

### 2.8 APIs That Are MISSING or Need Confirmation

> [!CAUTION]
> The following capabilities are required by `项目要求实现功能.txt` but do NOT have clear backend API support.

| # | Capability | Required By | Current Status | Action Needed |
|---|-----------|-------------|----------------|---------------|
| M1 | User 7-day PnL by token | `项目要求实现功能.txt` L54 | NO DEDICATED API | Backend to add `/wallet/pnl/summary?days=7` or Agent calculates from tx history |
| M2 | User liked/disliked news (7 days) | `项目要求实现功能.txt` L55 | No clear API | Backend to add or use `/topic/history` with like filter |
| M3 | User today's viewed news | `项目要求实现功能.txt` L56 | `/topic/history` exists but unclear | Confirm if it returns today's views |
| M4 | Chat history persistence (1-day short, 30-day summary) | `项目要求实现功能.txt` L80-82 | Agent local MEMORY.md | Decide: local only or backend `/chat/history` API? |
| M5 | User's current page context (pathname) | `项目要求实现功能.txt` L52 | Must come from frontend request | Frontend sends `currentPage` in chat request body |

---

## 3. Frontend Integration Specification (For the Frontend Team)

### 3.1 Chat API Interface

Frontend calls this endpoint to send user messages to the AI Agent:

```typescript
// POST /api/agent/chat
// This is the Agent's OWN API, not the backend API

interface ChatRequest {
    message: string;              // User input text
    sessionId: string;            // Chat session ID
    context: {
        currentPage: string;      // Current app route pathname
        walletAddress: string;    // Connected wallet address
        network: string;          // Active network
        locale: string;           // User language (zh/en)
    };
    quickAction?: string;         // Optional: triggered by button click (e.g., "analyze_portfolio")
}

interface ChatResponse {
    message: string;              // AI text response (may contain markdown)
    client_actions?: ClientAction[];  // Actions for frontend to execute
    metadata?: {
        toolsUsed: string[];      // Which tools were called
        tokensUsed: number;       // LLM token count
        duration: number;         // Response time in ms
    };
}
```

### 3.2 Frontend Responsibilities

| Task | Description | Priority |
|------|-------------|----------|
| **Parse client_actions** | After receiving ChatResponse, iterate `client_actions` and render appropriate UI | P0 |
| **Trade Confirmation Modal** | When `type === 'CONFIRM_TRANSACTION'`, show tx details, await user Click -> call Privy API | P0 |
| **Trade Window** | When `type === 'OPEN_TRADE_WINDOW'`, open trade panel with pre-filled params | P0 |
| **Deposit Redirect** | When `type === 'OPEN_DEPOSIT'`, navigate to deposit/buy page | P0 |
| **Quick Action Buttons** | When `type === 'QUICK_ACTIONS'`, render clickable buttons that send preset messages | P1 |
| **Markdown Rendering** | Render AI message text as Markdown (tables, bold, lists) | P1 |
| **Pass Context** | Every chat request must include `currentPage`, `walletAddress`, `network` | P0 |
| **Session Management** | Manage `sessionId` for conversation continuity | P0 |

### 3.3 Frontend client_action Handler Example

```typescript
// frontend/hooks/useAgentChat.ts

function handleClientActions(actions: ClientAction[]) {
    for (const action of actions) {
        switch (action.type) {
            case 'OPEN_TRADE_WINDOW':
                // Open the swap/trade modal
                openTradeModal({
                    token: action.params.symbol,
                    side: action.params.side,       // BUY or SELL
                    type: action.params.tradeType,   // SPOT or CONTRACT
                    network: action.params.network,
                    amount: action.params.amount,
                });
                break;

            case 'CONFIRM_TRANSACTION':
                // Show confirmation dialog, then sign via Privy
                showConfirmDialog({
                    ...action.params,
                    onConfirm: async () => {
                        const result = await privySignAndSend({
                            network: action.params.network,
                            from: action.params.from,
                            to: action.params.to,
                            value: action.params.value,
                            data: action.params.data,
                        });
                        // Send confirmation result back to agent
                        sendMessage(`Transaction ${result.txHash ? 'successful' : 'failed'}: ${result.txHash || result.error}`);
                    },
                    onCancel: () => {
                        sendMessage('User cancelled the transaction.');
                    },
                });
                break;

            case 'NAVIGATE':
                router.push(action.params.path);
                break;

            case 'OPEN_DEPOSIT':
                router.push('/deposit');
                break;

            case 'QUICK_ACTIONS':
                // Render action buttons in chat
                renderActionButtons(action.params.buttons);
                break;

            case 'SHOW_TABLE':
                // Render table in chat message area
                renderTable(action.params);
                break;
        }
    }
}
```

---

## 4. Team Division & Responsibilities

### 4.1 Role Matrix

```
+-------------------+     +-------------------+     +-------------------+
|   Frontend Team   |     |   Backend Team    |     |   AI/Agent Team   |
| (React Native /   |     | (Java/Spring)     |     | (This Project)    |
|  Next.js App)     |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
| Chat UI           |     | Data APIs         |     | LLM Integration   |
| Wallet Connect    |     | User Management   |     | Skill Design      |
| Trade Modal       |     | Market Data       |     | Tool Implementation|
| client_action     |     | Transaction Backend|    | Context Assembly  |
|   Handler         |     | News/Topic CRUD   |     | Memory System     |
| Privy SDK         |     | Security Checks   |     | System Prompt     |
| Markdown Render   |     | Contract APIs     |     | client_action     |
| Context Injection |     | Auth/JWT          |     |   Generation      |
+-------------------+     +-------------------+     +-------------------+
```

### 4.2 Detailed Task Breakdown

#### AI/Agent Team (This Project - lite-agent-demo)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | LLM Provider abstraction | `src/providers/index.ts` | DONE |
| 2 | Agent Engine (multi-turn loop) | `src/agent/engine.ts` | DONE |
| 3 | Skill Loader + Eligibility | `src/agent/skills.ts` | DONE |
| 4 | Tool Registry | `src/agent/tools.ts` | DONE |
| 5 | Service Layer (API wrappers) | `src/services/*.ts` | DONE |
| 6 | Tool Implementations | `src/agent/tools/*.ts` | DONE |
| 7 | Skill Definitions (trade, news, asset...) | `skills/*.md` | DONE |
| 8 | Memory System | `src/memory/` | DONE |
| 9 | Context Assembler | `src/agent/context-assembler.ts` | DONE |
| 10 | System Prompt Builder | `src/agent/system-prompt.ts` | DONE |
| 11 | Expose HTTP endpoint for frontend | `src/server.ts` (NEW) | TODO |
| 12 | client_action type definitions | `src/types/client-action.ts` (NEW) | TODO |
| 13 | Context injection from frontend params | `src/agent/engine.ts` update | TODO |

#### Frontend Team

| # | Task | Priority |
|---|------|----------|
| 1 | Chat UI component (message list, input) | P0 |
| 2 | Connect to Agent `/api/agent/chat` endpoint | P0 |
| 3 | Pass `context` (currentPage, walletAddress, network) in every request | P0 |
| 4 | client_action parser and handler | P0 |
| 5 | Trade confirmation modal (CONFIRM_TRANSACTION) | P0 |
| 6 | Trade window with pre-filled params (OPEN_TRADE_WINDOW) | P0 |
| 7 | Deposit redirect (OPEN_DEPOSIT) | P1 |
| 8 | Quick action buttons (QUICK_ACTIONS) | P1 |
| 9 | Markdown table rendering in chat | P1 |
| 10 | Privy SDK integration for wallet signing | P0 |
| 11 | Session ID management | P1 |

#### Backend Team

| # | Task | Priority |
|---|------|----------|
| 1 | Confirm all existing API paths match spec | P0 |
| 2 | Add `/profiles/profile` -> 4D persona field if missing | P1 |
| 3 | Add PnL summary API or confirm calculation method | P1 |
| 4 | Add user news interaction history (liked/disliked) API if missing | P2 |
| 5 | Ensure CORS allows Agent server origin | P0 |
| 6 | Provide test JWT tokens for integration testing | P0 |

---

## 5. Agent Capability Gap Analysis vs `项目要求实现功能.txt`

### 5.1 Supported Features (Agent ALREADY Handles)

| Requirement | How Agent Handles It | Tools Used |
|------------|---------------------|------------|
| L3: AI trade suggestions based on user state | system prompt + persona context + `check_usdc_balance` | `check_usdc_balance`, `create_trade_intent` |
| L4: Balance check before trade | `trade_helper` skill auto-checks USDC first | `check_usdc_balance` |
| L6: Remind deposit when USDC low | `deposit_reminder` skill + `OPEN_DEPOSIT` action | `check_usdc_balance` |
| L62: Quick asset analysis button | `asset_analyst` skill triggers on button | `get_holding_list`, `get_token_price` |
| L68: Query total USD balance | `get_wallet_balance` tool | `get_wallet_balance` |
| L69: Query single token balance | `get_wallet_balance` with tokenAddress | `get_wallet_balance` |
| L70: Query token news/price trend | `news_digest` + `price_query` skill | `get_topic_list`, `get_token_kline` |
| L72: Asset analysis with markdown table | `asset_analyst` skill, output markdown table | `get_holding_list`, `get_token_price` |
| L74-75: Trade with USDC check first | `trade_helper` skill flow | `check_usdc_balance` -> `create_trade_intent` |
| L76-77: Spot/contract trade window | `create_trade_intent` returns `OPEN_TRADE_WINDOW` | `create_trade_intent` |

### 5.2 Features That Need More Work

| Requirement | Gap | Priority | Solution |
|------------|-----|----------|----------|
| L52: currentPage context | Agent receives it but frontend must send it | P0 | Frontend sends in request body; Agent uses in prompt |
| L53: 7-day trade history context | Tool exists but not auto-injected | P1 | Context assembler should pre-fetch on session start |
| L54: 7-day PnL per token | No dedicated API; must calculate or backend provides | P1 | Request backend API or calculate from tx history |
| L55-56: Liked/viewed news context | No API confirmed | P2 | Needs backend confirmation |
| L58: Cat persona with user 4D | Persona prompt exists in architecture but not fully wired | P1 | Wire `get_user_profile` into system prompt context |
| L78: Simulated trade result popup | Not implemented | P2 | Future: add `SHOW_TRADE_SIMULATION` client_action |
| L79: Batch position adjustment (DeFi) | Not implemented | P3 | Future phase |
| L80-82: Chat history 1d short / 30d long | Memory system is local only, not synced with backend | P2 | Current local memory is functional; backend sync later |

### 5.3 Assessment

**Overall: The agent architecture is solid and covers ~80% of requirements.**

The remaining 20% primarily requires:
1. Frontend to properly send `context` in every request (P0)
2. Backend to confirm/add 2-3 missing APIs (P1)
3. Persona system prompt wiring (P1)
4. A few advanced features deferred to future phases (P2-P3)

---

## 6. Integration Timeline Recommendation

```
Week 1: Frontend connects chat UI to Agent API
         Backend confirms API paths + provides test tokens
         AI team exposes HTTP endpoint (src/server.ts)

Week 2: Frontend implements OPEN_TRADE_WINDOW + CONFIRM_TRANSACTION handlers
         Backend adds missing PnL/persona APIs if needed
         AI team wires persona context into system prompt

Week 3: End-to-end integration testing
         Fix edge cases (error handling, timeout, retry)
         
Week 4: Polish UX (quick actions, markdown tables, chart display)
         Performance optimization
```

---

## Appendix: Existing API Documentation Reference

Full API documentation with all 70+ endpoints is available at:
- [API开发文档(精炼).md](file:///d:/MYdexAIframe/lite-agent-demo/docs/API%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3%28%E7%B2%BE%E7%82%BC%29.md)

Base URL: `http://tbo.mydex.io/app-api`
Auth: Bearer Token (JWT)
Response format: `{ code: 200, message: "...", data: {...} }`
