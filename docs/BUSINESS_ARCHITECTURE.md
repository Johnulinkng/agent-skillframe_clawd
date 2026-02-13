# MyDex AI Agent 业务技术架构文档

> 基于当前agent-skill（工具）模式驱动的智能化Web3交易所辅助产品

---
## 0. 框架描述
按照业务领域（Skill 对应领域）进行拆分，以下是具体的实施步骤：
1. API 抽象层：src/services/api.service.ts
目的：统一管理底层 HTTP 请求、鉴权（Auth）和 Base URL。如果不拆分，代码中会散落大量的 fetch 调用，极难维护。

实现方式：创建一个基础服务类，封装常用的 GET/POST 方法
规划：即使 API 很多，也可以在 src/services/ 目录下按领域分文件，例如：
src/services/user.service.ts (画像、资产、盈亏)
src/services/news.service.ts (新闻列表、AI 分析)
src/services/trade.service.ts (价格、预检查)
2. 工具适配层：src/agent/tools/ (按 Skill 区分)
目的：将 Skill 需要调用的具体功能封装成 Agent 可识别的工具（Tools）。 做法：在 src/agent/tools/ 目录下创建与 Skill 对应的子文件。


## 1. 框架定位与技术选型
**Lite-Agent 是一个轻量级的 **Skills-Driven Agent Framework**

**核心工作方式**：
1. **Skills (技能)**: 以 Markdown 文件定义，包含触发条件和执行流程具体设计参考skills_analysis.md
2. **Tools (工具)**: TypeScript 函数，可被 LLM 调用执行具体操作
3. **Engine (引擎)**: 协调 LLM 对话、Skill 匹配和 Tool 调用的循环

按照业务领域（Skill 对应领域）进行拆分。

以下是具体的实施架构建议：

1. API 抽象层：src/services/api.service.ts
目的：统一管理底层 HTTP 请求、鉴权（Auth）和 Base URL。如果不拆分，代码中会散落大量的 fetch 调用，极难维护。

实现方式：创建一个基础服务类，封装常用的 GET/POST 方法。
规划：即使 API 很多，也可以在 src/services/ 目录下按领域分文件，例如：
src/services/user.service.ts (画像、资产、盈亏)
src/services/news.service.ts (新闻列表、AI 分析)
src/services/trade.service.ts (价格、预检查)
2. 工具适配层：src/agent/tools/ (按 Skill 区分)
目的：将 Skill 需要调用的具体功能封装成 Agent 可识别的工具（Tools）。 做法：在 src/agent/tools/ 目录下创建与 Skill 对应的子文件。

src/agent/tools/user.ts: 注册 get_user_assets, get_user_pnl 等。
src/agent/tools/news.ts: 注册 get_news_list, get_news_analysis 等。
src/agent/tools/trade.ts: 注册 get_token_price, create_trade_intent 等。
这样做的好处是：当你想修改“资产分析”功能时，只需关注 skills/asset_analyst.md 和 src/agent/tools/user.ts。

3. 逻辑描述层：skills/*.md
目的：定义 AI 的行为逻辑。

## 2. Skills 驱动架构设计
通用的 API 请求	src/services/	保持代码 DRY (Don't Repeat Yourself)，易于维护
复杂的执行逻辑/脚本	skills/xxx/scripts/	
详细的业务规范/文档	skills/xxx/references/	
按需加载
### 2.1 核心 Skills 规划

基于业务需求，可能设计以下 Skills具体需求参考项目要求实现功能.txt：

| Skill 名称 | 触发条件 | 功能描述 | 依赖工具 |
|-----------|---------|---------|---------|
| `asset_analyst` | "分析持仓"、"资产分析"、点击猫窝按钮 | 分析用户现货/合约持仓，输出 Markdown 表格 | `get_user_assets`, `get_token_price` |
| `news_digest` | "最新新闻"、"XX币有什么消息" | 获取相关代币新闻，猫咪风格点评 | `get_news_by_token`, `get_news_analysis` |
| `trade_helper` | "买入BTC"、"卖出ETH"、交易意图 | 交易前检查余额，调起交易窗口 | `check_usdc_balance`, `create_trade_intent` |
| `deposit_reminder` | USDC余额不足时自动触发 | 提醒充值，返回充值按钮指令 | `check_usdc_balance` |
| `price_query` | "XX价格"、"XX多少钱" | 快速查询代币价格 | `get_token_price` |
| `pnl_report` | "今天赚了多少"、"盈亏情况" | 查询 7 日盈亏汇总 | `get_user_pnl` |

### 2.2 Skill 文件结构示例参考skills_analysis.md以及参考具体实践skills\summary.md


## 3. 具体 API 调用说明（根据实际情况调整）

### 3.1 可能需要调用的后端 API参考api.txt

以下是 Agent 可能需要集成的关键 API（这里只是做一个简单描述，具体以api.txt为准以及需要对接实现的所有功能为准：项目要求实现功能.txt）：

#### 用户与资产类/新闻类/交易类

| API 路径（推测） | 方法 | 功能 | Agent 工具名 |
|-----------------|------|------|-------------|
| `/user/info` | GET | 获取用户 4D 画像、人格描述 | `get_user_profile` |
| `/user/asset/balance` | GET | 获取用户各代币余额 | `get_user_assets` |
| `/user/asset/pnl` | GET | 获取 7 日盈亏数据 | `get_user_pnl` |
| `/user/trade/history` | GET | 获取交易记录 | `get_trade_history` |
| `/news/list` | GET | 获取新闻列表（支持 token 筛选） | `get_news_list` |
| `/news/detail/{id}` | GET | 获取单条新闻详情 | `get_news_detail` |
| `/news/analysis/{id}` | GET | 获取新闻 AI 分析报告 | `get_news_analysis` |
| `/news/user/history` | GET | 获取用户浏览过的新闻 | `get_user_news_history` |
| `/market/price/{symbol}` | GET | 获取代币实时价格 | `get_token_price` |
| `/trade/pre-check` | POST | 交易前检查（余额等） | `pre_trade_check` |

> 以上 API 路径为推测，需要您确认实际的接口文档。核心逻辑是：**每个 Agent Tool 对应一个或多个后端 API 调用**。

## 4. Tools 实现规划（根据实际情况调整）

基于 Skills 依赖以及上面的api调用基本假设，需要在 `src/agent/tools.ts` 注册以下工具：

### 4.1 工具清单

| 工具名 | 参数 | 返回 | 对应 API |
|--------|------|------|----------|
| `get_user_assets` | 无 | 资产列表 JSON | `/user/asset/balance` |
| `get_user_pnl` | `days?: number` | 盈亏数据 | `/user/asset/pnl` |
| `get_user_profile` | 无 | 4D 画像 | `/user/info` |
| `get_token_price` | `symbol: string` | 价格数据 | `/market/price/{symbol}` |
| `get_news_list` | `token?: string, limit?: number` | 新闻列表 | `/news/list` |
| `get_news_analysis` | `news_id: string` | AI 分析报告 | `/news/analysis/{id}` |
| `check_usdc_balance` | 无 | `{ sufficient: boolean, balance: number }` | `/user/asset/balance` (筛选 USDC) |
| `create_trade_intent` | `symbol, side, type` | 返回 `client_action` 指令 | 无需 API，直接返回指令 |

### 4.2 关键工具实现示例

```typescript
// src/agent/tools/trade.ts

globalRegistry.register(
    'create_trade_intent',
    {
        type: "function",
        function: {
            name: "create_trade_intent",
            description: "创建交易意图，返回让前端调起交易窗口的指令",
            parameters: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "代币符号，如 BTC, ETH" },
                    side: { type: "string", enum: ["BUY", "SELL"], description: "买入或卖出" },
                    trade_type: { type: "string", enum: ["SPOT", "CONTRACT"], description: "现货或合约" }
                },
                required: ["symbol", "side"]
            }
        }
    },
    async (args, ctx) => {
        // 不调用 API，直接返回前端可识别的 action
        return {
            status: "success",
            client_action: {
                type: "OPEN_TRADE_WINDOW",
                params: {
                    symbol: args.symbol,
                    side: args.side,
                    trade_type: args.trade_type || "SPOT"
                }
            }
        };
    },
    'trade'
);
```

---

## 5. 上下文注入机制（根据实际情况调整）

### 5.1 Context 来源

| 上下文数据 | 来源 | 注入方式 |
|-----------|------|---------|
| 当前页面 (`page_path`) | 前端请求 Header/Body | `{{ current_page }}` |
| 用户 4D 画像 | `/user/info` API | `{{ user_persona }}` |
| USDC 余额 | `/user/asset/balance` | `{{ usdc_balance }}` |
| 7 日盈亏 | `/user/asset/pnl` | `{{ pnl_7d }}` |
| 最近浏览新闻 | `/news/user/history` | `{{ recent_news }}` |

### 5.2 System Prompt 模板

// src/agent/prompts/persona.ts

export function buildSystemPrompt(ctx: AgentContext): string {
    return `
你是 MyDex 的 AI 助手，一只拟人化的智慧猫咪。

## 你的人设
- 性格：友好、专业、略带俏皮
- 称呼用户为"主银"
- 使用"喵~"等口头禅

## 用户画像
- 4D 类型: ${ctx.user4DType}
- 画像描述: ${ctx.userPersonaDesc}

## 当前状态
- 页面: ${ctx.currentPage}
- USDC 余额: $${ctx.usdcBalance}
- 7日盈亏: ${ctx.pnl7d > 0 ? '+' : ''}$${ctx.pnl7d}

## 重要规则
${ctx.usdcBalance < 10 ? '用户 USDC 余额不足，任何交易建议前必须先提醒充值！' : ''}

## 可用技能
${ctx.skillsPrompt}
    `;
}
```

---

## 6. Directory Structure (Updated)

lite-agent-demo/
├── src/
│   ├── services/                    # API Layer - Backend HTTP calls
│   │   ├── api.base.ts              # [DONE] Base Fetch wrapper
│   │   ├── wallet.service.ts        # [DONE] Wallet balance, holdings, history
│   │   ├── transaction.service.ts   # [DONE] Transaction settings, Privy signing
│   │   ├── market.service.ts        # [DONE] Market data, K-line, price
│   │   ├── token.service.ts         # [DONE] Token follow, search, hot
│   │   ├── news.service.ts          # [DONE] AI analysis, AI order
│   │   ├── security.service.ts      # [DONE] Token security check
│   │   ├── topic.service.ts         # [DONE] Topic list, detail, follow
│   │   ├── contract.service.ts      # [DONE] Contract/perpetual trading
│   │   ├── user.service.ts          # [DONE] User profile, settings
│   │   ├── point.service.ts         # [DONE] Check-in, tasks, rewards
│   │   ├── common.service.ts        # [DONE] Chain types, config
│   │   └── search.service.ts        # [DONE] Global search
│   ├── agent/
│   │   ├── engine.ts                # [DONE] Agent engine
│   │   ├── skills.ts                # [DONE] Skill loader
│   │   ├── tools.ts                 # [DONE] Tool registry
│   │   ├── tools/                   # Tool files
│   │   │   ├── memory.ts            # [DONE] memory_search, memory_get
│   │   │   ├── wallet.ts            # [DONE] get_wallet_balance, get_holding_list, get_tx_history
│   │   │   ├── trade.ts             # [DONE] check_usdc_balance, create_trade_intent, sign_and_send_transaction (with user confirmation), execute_confirmed_transaction
│   │   │   ├── market.ts            # [DONE] get_token_price, get_token_detail, get_token_kline, search_token, get_hot_tokens
│   │   │   ├── news.ts              # [DONE] get_ai_analysis, create_ai_order, check_token_security
│   │   │   ├── topic.ts             # [DONE] get_topic_list, get_topic_detail, get_hot_topics, follow_topic
│   │   │   ├── token.ts             # [DONE] get_followed_tokens, follow_token, get_token_warnings
│   │   │   └── user.ts              # [DONE] get_user_profile, check_in, get_task_list, claim_task_reward
│   │   ├── history.ts               # [DONE] Short-term chat history
│   │   ├── context-assembler.ts     # [DONE] Context assembler
│   │   └── system-prompt.ts         # [DONE] System prompt builder
│   ├── memory/                      # [DONE] Memory system
│   │   └── ...
│   └── providers/                   # LLM Providers
│       └── index.ts
├── skills/                          # Logic Layer - Skill definitions
│   ├── trade_helper/SKILL.md        # [DONE] Trade flow with balance check
│   ├── asset_analyst/SKILL.md       # [DONE] Portfolio analysis
│   ├── price_query/SKILL.md         # [DONE] Quick price queries
│   ├── news_digest/SKILL.md         # [DONE] News and AI analysis
│   ├── deposit_reminder/SKILL.md    # [DONE] Insufficient balance handling
│   ├── web3_analyst/SKILL.md              # [DONE] On-chain analysis
│   └── summary.md                   # [DONE] Summary generation
└── docs/
    ├── BUSINESS_ARCHITECTURE.md
    ├── API_INTEGRATION_SPEC.md      # [NEW] API integration spec, client_action protocol, team division
    ├── AI_AGENT_V2_TASKS.md         # [NEW] V2 AI/Agent + Recommendation system task breakdown (89 tasks)
    ├── AI_TEAM_ALLOCATION.md        # [NEW] 3-person AI team module assignment & task allocation
    └── API Development Documentation
```

---

## 7. Implementation Status (Updated 2026-02-03)

### Phase 1: Core Trading (P0) - COMPLETE
- [x] `api.base.ts` - Base HTTP wrapper with auth
- [x] `wallet.service.ts` - Balance, holdings, tx history
- [x] `transaction.service.ts` - Settings, Privy signing
- [x] `wallet.ts` tools - get_wallet_balance, get_holding_list, get_tx_history
- [x] `trade.ts` tools - check_usdc_balance, create_trade_intent, sign_and_send_transaction (with CONFIRM_TRANSACTION)
- [x] `trade_helper/SKILL.md` - Trade flow with balance check

### Phase 2: Market Data (P1) - COMPLETE
- [x] `market.service.ts` - Token detail, 24h, K-line, pools
- [x] `token.service.ts` - Follow, search, hot tokens
- [x] `market.ts` tools - get_token_price, get_token_detail, search_token
- [x] `price_query/SKILL.md` - Quick price queries
- [x] `asset_analyst/SKILL.md` - Portfolio analysis

### Phase 3: News & Topics (P2) - COMPLETE
- [x] `news.service.ts` - AI analysis, AI order
- [x] `topic.service.ts` - Topic list, detail, follow
- [x] `security.service.ts` - Token security check
- [x] `news.ts` tools - get_ai_analysis, create_ai_order, check_token_security
- [x] `topic.ts` tools - get_topic_list, get_topic_detail, follow_topic
- [x] `news_digest/SKILL.md` - News retrieval and AI analysis

### Phase 4: Extended Features (P3) - COMPLETE
- [x] `contract.service.ts` - Perpetual trading
- [x] `user.service.ts` - User profile, settings
- [x] `point.service.ts` - Check-in, tasks
- [x] `common.service.ts` - Chain types
- [x] `search.service.ts` - Global search
- [x] `token.ts` tools - get_followed_tokens, follow_token
- [x] `user.ts` tools - get_user_profile, check_in, get_task_list
- [x] `deposit_reminder/SKILL.md` - Balance insufficient handling
- [x] `web3_analyst.md` - On-chain analysis

---

## 8. Service Layer - API Mapping

| Service | APIs Covered | Key Methods |
|---------|-------------|-------------|
| `api.base.ts` | Base infrastructure | GET/POST/DELETE with Authorization |
| `wallet.service.ts` | `/wallet/token/balance`, `/wallet/token/holding`, `/wallet/token/tx/history` | `getTokenBalance`, `getHolding`, `getTxHistory` |
| `transaction.service.ts` | `/transaction/settings`, `/privy/sign-and-send-transaction` | `getSettings`, `signAndSendTransaction` |
| `market.service.ts` | `/market/token/detail`, `/market/token/24h`, `/market/token/kline`, `/market/token/pools` | `getTokenDetail`, `getToken24h`, `getTokenKline` |
| `token.service.ts` | `/token/dex/search`, `/token/follow`, `/token/hot` | `dexSearch`, `followToken`, `getHotTokens` |
| `news.service.ts` | `/collection/ai_analyst`, `/collection/ai_order` | `aiAnalyst`, `aiOrder` |
| `security.service.ts` | `/security/token_security` | `checkTokenSecurity` |
| `topic.service.ts` | `/topic`, `/topic/detail/{id}`, `/topic/follow` | `getList`, `getDetail`, `follow` |
| `contract.service.ts` | `/contract/account/*`, `/contract/order/*` | `getPositions`, `createOrder` |
| `user.service.ts` | `/profiles/profile`, `/profiles/settings` | `getProfile`, `updateSettings` |
| `point.service.ts` | `/pointTask/checkIn`, `/pointTask/taskList` | `checkIn`, `getTaskList` |
| `common.service.ts` | `/common/chainTypes` | `getChainTypes` |
| `search.service.ts` | `/search` | `search` |

---

## 9. Tool Layer - Registration Summary

| Tool File | Registered Tools | Description |
|-----------|-----------------|-------------|
| `wallet.ts` | `get_wallet_balance`, `get_holding_list`, `get_tx_history` | Wallet and asset queries |
| `trade.ts` | `check_usdc_balance`, `get_transaction_settings`, `create_trade_intent`, `sign_and_send_transaction`, `execute_confirmed_transaction` | Trading operations with user confirmation |
| `market.ts` | `get_token_price`, `get_token_detail`, `get_token_kline`, `search_token`, `get_hot_tokens` | Market data queries |
| `news.ts` | `get_ai_analysis`, `create_ai_order`, `check_token_security` | AI analysis and security |
| `topic.ts` | `get_topic_list`, `get_topic_detail`, `get_hot_topics`, `follow_topic` | News topic management |
| `token.ts` | `get_followed_tokens`, `follow_token`, `get_token_warnings` | Token follow/watchlist |
| `user.ts` | `get_user_profile`, `check_in`, `get_task_list`, `claim_task_reward` | User profile and points |

---

## 10. Skill Layer - Summary

| Skill | Triggers | Purpose | Dependent Tools |
|-------|----------|---------|-----------------|
| `trade_helper` | buy, sell, swap, trade | Trade execution with balance check | `check_usdc_balance`, `create_trade_intent` |
| `asset_analyst` | analyze portfolio, my assets | Portfolio analysis with markdown table | `get_holding_list`, `get_token_price` |
| `price_query` | price of, how much is | Quick token price lookup | `get_token_price`, `search_token` |
| `news_digest` | news, latest news | News retrieval and AI analysis | `get_topic_list`, `get_ai_analysis` |
| `deposit_reminder` | (auto on low balance) | Deposit prompt when insufficient funds | `check_usdc_balance` |
| `web3_analyst` | analyze wallet, on-chain analysis | On-chain data analysis | `get_holding_list`, `get_tx_history` |

---

## 11. Development Best Practices & Risks

### 11.1 Context Overload Risk
- **Problem**: As skills grow, System Prompt gets longer
- **Solution**: Use progressive disclosure - only load relevant skills per session type

### 11.2 Skill Writing Quality
- **Key**: Agent intelligence depends on SKILL.md quality
- **Best Practices**:
  - Clear step-by-step SOP
  - 1-2 few-shot examples
  - Non-overlapping trigger conditions

### 11.3 Tool Robustness
- Validate `args` with Zod or manual checks
- Return `{ status: "error", message: "..." }` instead of throwing exceptions
- Allow LLM to self-correct on failures

### 11.4 Transaction Safety
- **CRITICAL**: `sign_and_send_transaction` returns `CONFIRM_TRANSACTION` client_action
- Frontend must show confirmation dialog before executing
- Only `execute_confirmed_transaction` actually sends transaction after user approval

### 11.5 Memory System
- Keep `MEMORY.md` concise and high-value
- Avoid large log files in scan paths

### 11.6 Testing Strategy
1. Unit test Tools first
2. Integration test Service -> Tool flow
3. E2E test full Agent conversation

