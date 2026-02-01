# Web3 Agent 微服务架构技术文档

## 目录

1. [架构概览](#1-架构概览)
2. [核心模块说明](#2-核心模块说明)
3. [业务扩展指南](#3-业务扩展指南)
4. [Skill 开发规范](#4-skill-开发规范)
5. [微服务拆分策略](#5-微服务拆分策略)
6. [集成最佳实践](#6-集成最佳实践)

---

## 1. 架构概览

### 1.1 当前架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                               │
│                      (Express Server)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AgentEngine                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ SkillLoader │  │ ToolManager │  │  LLM Client │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ Skills  │   │  Tools  │   │   LLM   │
        │  (.md)  │   │ (Web3)  │   │ (Qwen)  │
        └─────────┘   └─────────┘   └─────────┘
```

### 1.2 推荐的微服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│            (Load Balancer / Authentication / Rate Limiting)      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Agent Core   │   │  Skill Registry│   │  Tool Service │
│   Service     │   │    Service     │   │   (Web3)      │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Message Queue │
                    │  (Optional)   │
                    └───────────────┘
```

---

## 2. 核心模块说明

### 2.1 AgentEngine (`src/agent/engine.ts`)

**职责**: Agent 核心引擎，负责协调 LLM 调用、工具执行和技能匹配。

**关键方法**:
| 方法 | 描述 |
|------|------|
| `run()` | 主执行循环，处理用户消息并返回流式响应 |
| `buildSystemPrompt()` | 动态构建系统提示词（内联实现） |

**扩展点**:
- **多模型支持**: 创建 `Provider` 接口抽象 LLM 调用
- **会话管理**: 添加 `SessionManager` 处理对话历史持久化
- **中间件**: 在 `run()` 入口添加前置/后置处理器

```typescript
// 建议的 Provider 接口
interface LLMProvider {
  name: string;
  chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string>;
  getTools(): Tool[];
}
```

### 2.2 SkillLoader (`src/agent/skills.ts`)

**职责**: 加载和解析 Markdown 格式的 Skill 定义。

**当前能力**:
- ✅ 支持 YAML Frontmatter 元数据
- ✅ 上下文变量注入 (`{{ variable }}`)
- ✅ 递归目录扫描
- ✅ 支持 `disabled` 标记跳过技能

**扩展建议**:
- 添加 `requires` 元数据验证（依赖检查）
- 支持 Skill 版本控制
- 添加 Skill 热重载

### 2.3 ToolManager (`src/agent/tools.ts`)

**职责**: 定义和执行工具函数。

**当前工具**:
| 工具名 | 描述 | 分类 |
|--------|------|------|
| `list_files` | 列出目录文件 | 文件系统 |
| `read_file` | 读取文件内容 | 文件系统 |
| `write_file` | 写入文件 | 文件系统 |
| `get_exchange_balance` | 获取加密货币余额 | Web3 |

**扩展建议**:
- 实现工具注册表模式（插件化）
- 添加工具权限控制
- 支持异步工具超时处理

---

## 3. 业务扩展指南

### 3.1 Web3 业务集成点

```
lite-agent-demo/
├── src/
│   ├── agent/
│   │   └── tools.ts          # [集成点1] 添加 Web3 工具
│   ├── services/             # [新建] 业务服务层
│   │   ├── wallet.service.ts      # 钱包管理
│   │   ├── defi.service.ts        # DeFi 协议交互
│   │   ├── token.service.ts       # 代币信息查询
│   │   └── chain.service.ts       # 链上数据查询
│   └── providers/            # [新建] LLM 提供商
│       ├── index.ts
│       └── qwen.provider.ts
├── skills/                   # [集成点2] 添加业务 Skill
│   ├── web3_balance.md            # 余额查询
│   ├── swap_router.md             # 兑换路由
│   └── nft_analyzer.md            # NFT 分析
└── config/                   # [新建] 配置管理
    └── chains.json                # 链配置
```

### 3.2 常见业务场景集成

#### 场景1: 链上资产查询

**Skill**: `skills/chain_explorer.md`
```markdown
---
description: Query on-chain data using blockchain explorers
requires:
  - ethers.js
---

# Chain Explorer Skill

When user asks about wallet balance, token holdings, or transaction history:

1. Parse the wallet address or ENS name
2. Call `get_chain_data` tool with appropriate parameters
3. Format results in markdown table
```

**Tool**: `src/agent/tools.ts`
```typescript
{
    type: "function",
    function: {
        name: "get_chain_data",
        description: "Query blockchain data",
        parameters: {
            type: "object",
            properties: {
                chain: { type: "string", enum: ["ethereum", "bsc", "polygon"] },
                address: { type: "string" },
                type: { type: "string", enum: ["balance", "tokens", "transactions"] }
            },
            required: ["chain", "address", "type"]
        }
    }
}
```

**Service**: `src/services/chain.service.ts`
```typescript
import { ethers } from 'ethers';

export class ChainService {
    private providers: Map<string, ethers.JsonRpcProvider> = new Map();

    async getBalance(chain: string, address: string): Promise<string> {
        const provider = this.getProvider(chain);
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
    }
}
```

#### 场景2: DeFi 协议交互

**Skill**: `skills/defi_swap.md`
**Tool**: `swap_tokens`, `get_quote`
**Service**: `src/services/defi.service.ts`

#### 场景3: NFT 分析

**Skill**: `skills/nft_analyzer.md`
**Tool**: `get_nft_collection`, `analyze_nft_floor`
**Service**: `src/services/nft.service.ts`

---

## 4. Skill 开发规范

### 4.1 文件结构

**简单 Skill** (单文件):
```
skills/
└── my_skill.md
```

**复杂 Skill** (目录结构):
```
skills/
└── my_skill/
    ├── SKILL.md           # 主定义文件
    ├── examples/          # 示例
    └── scripts/           # 辅助脚本
```

### 4.2 Frontmatter 规范

```yaml
---
# 必填字段
name: skill_name                    # Skill 标识符 (snake_case)
description: 简短描述               # 一行描述

# 可选字段
disabled: false                     # 是否禁用
requires:                           # 依赖声明
  bins:                             # 系统命令依赖
    - curl
    - jq
  packages:                         # npm 包依赖
    - ethers
    
metadata:                           # 扩展元数据
  category: web3                    # 分类
  author: your_team                 # 作者
  version: 1.0.0                    # 版本
---
```

### 4.3 Skill 内容模板

```markdown
# [Skill 名称]

[简短描述这个 Skill 做什么]

## 触发条件

当用户消息包含以下关键词时激活此 Skill:
- 关键词1
- 关键词2

## 执行步骤

1. **解析请求**: [描述如何解析用户输入]
2. **调用工具**: [描述需要调用哪些工具]
3. **处理结果**: [描述如何处理工具返回]
4. **格式化输出**: [描述输出格式]

## 示例

**输入**: "查询 0x1234...abcd 在以太坊上的余额"
**输出**: 
\```
钱包余额: 1.234 ETH
\```

## 注意事项

- [任何特殊处理逻辑]
- [错误处理说明]
```

### 4.4 上下文变量使用

在 Skill 中使用 `{{ variableName }}` 语法注入运行时上下文:

```markdown
## 用户信息

当前用户: {{ userName }}
用户钱包: {{ userWallet }}
```

调用时在 `context` 参数传入:
```typescript
agent.run(message, history, onStream, {
    userName: "Alice",
    userWallet: "0x1234..."
});
```

---

## 5. 微服务拆分策略

### 5.1 Phase 1: 单体优化 (当前阶段)

**目标**: 模块化内部结构，为后续拆分做准备。

```
lite-agent-demo/
├── src/
│   ├── agent/            # Agent 核心
│   ├── services/         # 业务服务 (新增)
│   ├── providers/        # LLM 提供商 (新增)
│   └── server.ts         # HTTP 入口
├── skills/               # Skill 定义
└── config/               # 配置文件 (新增)
```

**关键任务**:
1. ✅ 当前架构支持 Qwen API
2. 🔲 创建 Provider 抽象层
3. 🔲 分离业务服务
4. 🔲 添加配置管理

### 5.2 Phase 2: 服务分层

**目标**: 按职责分离独立服务。

```
web3-agent-platform/
├── agent-core/           # Agent 核心服务
│   ├── src/
│   └── Dockerfile
├── skill-registry/       # Skill 注册服务
│   ├── src/
│   └── Dockerfile
├── tool-executor/        # 工具执行服务
│   ├── src/
│   └── Dockerfile
└── gateway/              # API 网关
    └── nginx.conf
```

**服务通信**: HTTP/gRPC

### 5.3 Phase 3: 完整微服务

**目标**: 支持水平扩展和高可用。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Agent Core  │  │ Agent Core  │  │ Agent Core  │  (3 replicas) │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                           │                                       │
│  ┌─────────────────────────────────────────────────┐             │
│  │                   Redis Cluster                  │             │
│  │             (Session Storage + Cache)            │             │
│  └─────────────────────────────────────────────────┘             │
│                           │                                       │
│  ┌─────────────────────────────────────────────────┐             │
│  │               PostgreSQL / MongoDB              │             │
│  │           (Skill Registry + Analytics)          │             │
│  └─────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 集成最佳实践

### 6.1 安全考虑

1. **API Key 管理**: 使用环境变量，永不提交到代码仓库
2. **工具沙箱**: 对文件系统操作限制在 workspace 目录
3. **输入验证**: 所有用户输入进行清洗和验证
4. **速率限制**: 对 API 端点实施速率限制

### 6.2 错误处理

```typescript
// 建议的错误处理模式
async executeTool(name: string, args: any): Promise<ToolResult> {
    try {
        const result = await this.doExecute(name, args);
        return { status: "success", data: result };
    } catch (error) {
        if (error instanceof ValidationError) {
            return { status: "error", code: "VALIDATION_ERROR", message: error.message };
        }
        if (error instanceof TimeoutError) {
            return { status: "error", code: "TIMEOUT", message: "Tool execution timed out" };
        }
        // Log and return generic error
        console.error(`Tool ${name} failed:`, error);
        return { status: "error", code: "INTERNAL_ERROR", message: "Unexpected error" };
    }
}
```

### 6.3 可观测性

**日志规范**:
```typescript
// 结构化日志
console.log(JSON.stringify({
    level: "info",
    service: "agent-core",
    event: "tool_execution",
    tool: toolName,
    duration_ms: Date.now() - startTime,
    status: "success"
}));
```

**指标建议**:
- `agent_requests_total` - 请求总数
- `agent_response_latency_ms` - 响应延迟
- `tool_execution_duration_ms` - 工具执行时间
- `skill_match_count` - 技能匹配次数

### 6.4 测试策略

```
tests/
├── unit/                     # 单元测试
│   ├── skills.test.ts
│   ├── tools.test.ts
│   └── engine.test.ts
├── integration/              # 集成测试
│   └── api.test.ts
└── e2e/                      # 端到端测试
    └── chat-flow.test.ts
```

---

## 附录: 快速参考

### 添加新工具 Checklist

- [ ] 在 `tools.ts` 中定义工具 schema
- [ ] 在 `ToolManager.executeTool()` 中实现执行逻辑
- [ ] 创建对应的 Skill 文档 (`skills/xxx.md`)
- [ ] 添加测试用例
- [ ] 更新此文档

### 添加新 Skill Checklist

- [ ] 创建 `skills/skill_name.md` 或 `skills/skill_name/SKILL.md`
- [ ] 填写 Frontmatter 元数据
- [ ] 编写触发条件和执行步骤
- [ ] 添加示例
- [ ] 测试 Skill 匹配和执行

### 环境变量参考

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `OPENAI_API_KEY` | LLM API 密钥 | `sk-xxxxx` |
| `OPENAI_BASE_URL` | API 基础 URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `PORT` | 服务端口 | `3000` |
| `MODEL` | 使用的模型 | `qwen-max` |
