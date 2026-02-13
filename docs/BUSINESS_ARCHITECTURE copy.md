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

## 6. 严格按照下面目录规划去生成代码

lite-agent-demo/
├── src/
│   ├── services/               # 【API 层】负责真实的后端 HTTP 调用/后端 API 调用封装逻辑
│   │   ├── api.base.ts         # 基础 Fetch 封装 (处理 Token、Header、错误拦截)
│   │   ├── user.service.ts     # 用户画像、4D 人格、偏好设置 API
│   │   ├── asset.service.ts    # 余额查询、持仓分析、盈亏数据 API
│   │   ├── news.service.ts     # 新闻列表、AI 报告、相关代币 API
│   │   └── trade.service.ts    # 价格获取、交易预检查 API
│   │   └── context.service.ts   # 上下文聚合
│   ├── agent/
│   │   ├── engine.ts            # Agent 引擎
│   │   ├── skills.ts            # Skill 加载器
│   │   ├── tools.ts             # 工具注册表
│   │   ├── tools/               # 工具分文件
│   │   │   ├── user.ts          # 用户相关工具
│   │   │   ├── news.ts          # 新闻相关工具
│   │   │   ├── trade.ts         # 交易相关工具
│   │   │   └── memory.ts        # [已实现] 记忆工具 (memory_search, memory_get, memory_status)
│   │   ├── history.ts           # [已实现] 短期对话历史管理
│   │   ├── context-assembler.ts # [已实现] 上下文装配器
│   │   └── system-prompt.ts     # [已实现] 系统提示构建器
│   ├── memory/                  # [已实现] 记忆系统模块
│   │   ├── config.ts            # 配置接口 (local/openai/qwen)
│   │   ├── embeddings-lite.ts   # Embedding 提供者 (默认本地 all-MiniLM-L6-v2)
│   │   ├── lite-manager.ts      # 核心记忆管理器
│   │   ├── history.ts           # 长期历史格式化
│   │   ├── internal.ts          # 文件扫描/分块工具
│   │   └── index.ts             # 模块导出
│   └── providers/               # LLM 提供商
│      └── index.ts
│   ├── utils.ts                 # [已实现] 工具函数 (resolveUserPath, ensureDir, createLogger)
│   ├── types/                  # 全局类型定义（包含 Client Action 协议）
│   └── utils/                  # 通用工具（格式化金额、时间等）
├── MEMORY.md                    # [已实现] Agent 长期记忆存储
├── skills/                     # 【逻辑层】技能定义，支持“按需加载”
│   ├── asset_analyst/          # 资产分析技能文件夹
│   │   ├── skill.md            # 触发条件、执行步骤（Markdown）
│   │   └── references/         # (可选) 复杂的表格渲染规范或分析指标
│   ├── news_digest/            # 新闻摘要技能
│   │   └── skill.md            # 触发条件：XX币有什么消息
│   └── trade_helper/           # 交易助手技能
│       └── skill.md            # 核心逻辑：先检查 USDC 余额再调起交易
│       └── ...
└── docs/
    └── BUSINESS_ARCHITECTURE.md # 本文档
    ├── storage/                 # 临时数据存储（如本地缓存的记忆 JSON 文件）
└── config/                     # LLM 模型配置、API Keys、环境变量
```

---

## 7. 实施路径
### Phase 1: API 集成

1. 确认后端 API 文档，填充真实路径
2. 实现 `get_user_assets`, `get_token_price` 等基础工具

### Phase 2: 对应Skills 编写
1. 编写 `skills/asset_analyst.md`
...
最后测试 Skill 匹配和工具调用链路

### Phase 3: 上下文与人设
1. 实现 `context.service.ts`
2. 编写 `prompts/persona.ts`
3. 集成到 `engine.ts` 的 System Prompt

### Phase 4: 前端联调
1. 定义 `client_action` 响应协议
2. 编写与 App 团队联调充值/交易逻辑规则

---



## 8. Development Best Practices & Risks (开发注意事项)

在集成业务逻辑的过程中，请务必关注以下风险点：

### 8.1 上下文过载风险 (Context Overload)
*   **问题**：随着 `skills/` 目录下的 Skills 增多，`context-assembler.ts` 会将所有 Skills 描述注入 System Prompt。
*   **风险**：Token 消耗激增，且 LLM 对过长指令的遵循能力下降。
*   **建议**：
    *   **按需加载**：后续应实现 Skill 的动态检索或基于 Session 类型的分类加载（例如 `PaymentSession` 只加载交易类 Skill）。
    *   **精简描述**：`SKILL.md` 的 `description` 属性必须极其精炼。

### 8.2 Skill 编写质量
*   **核心**：Agent 的智能程度取决于 `SKILL.md` 的编写质量。
*   **建议**：
    *   **明确SOP**：Skill 内部要包含详细的标准操作流程（Step-by-Step）。
    *   **Few-Shot**：提供 1-2 个具体的问答示例（User/Assistant）能显著提高稳定性。
    *   **避免歧义**：触发条件不要与其他 Skill 重叠。

### 8.3 工具健壮性

在 `src/agent/tools/*.ts` 中使用 Zod 或手动代码对 `args` 进行校验。
Tool 执行失败时，返回 `{ status: "error", message: "..." }` 而不是抛出异常，让 LLM 有机会自我修正。

### 8.4 记忆系统性能
*   **现状**：`LiteMemoryManager` 基于本地文件扫描。
*   **建议**：避免将巨大的日志文件放入 `MEMORY.md` 或扫描路径，保持长期记忆文件的精简和高价值。

### 8.5 调试
*   **建议**：先为 Tools 编写单元测试（Unit Test），确保 Tool 本身逻辑无误，再集成到 Agent 进行 E2E 测试。
