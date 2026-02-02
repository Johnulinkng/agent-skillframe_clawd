# MEMORY - Agent 长期记忆

这是 Agent 的长期记忆文件，用于存储重要信息供后续对话检索使用。

---

## 用户偏好

- 用户首选语言：中文
- 编码风格：清晰、模块化、有文档注释
- 常用技术栈：TypeScript, Node.js, Express, React

---

## 项目背景

### Lite Agent Demo
- 这是一个轻量级 AI Agent 框架演示项目
- 支持 Skills（技能）+ Tools（工具）的模块化架构
- 使用 Qwen 或 OpenAI 作为 LLM Provider

### Web3 相关
- 用户对 BTC、ETH 有投资兴趣
- 需要实时获取代币价格信息
- 关注 DeFi 和交易策略

---

## 技术决策记录

### 2026-02-02
- 采用本地 Embedding 模型 (`all-MiniLM-L6-v2`) 替代 OpenAI API
- 使用 `@huggingface/transformers` 实现本地向量化
- 记忆系统扫描 `MEMORY.md`, `memory/`, `skills/` 目录

---

## 重要备忘

- 每次对话前可使用 `memory_search` 工具检索相关历史
- Skills 文件中的信息也会被索引用于 Agent 理解
- 短期对话历史由 `ChatHistoryManager` 管理

---

## 交易相关记录

### BTC 分析
- 2026-01-15: 用户认为 BTC 将在 Q1 突破历史新高
- 风险偏好：中等

### ETH 分析  
- 关注以太坊 2.0 升级后的 staking 收益

---

## 联系方式

- GitHub: Johnulinkng/agent-skillframe_clawd
