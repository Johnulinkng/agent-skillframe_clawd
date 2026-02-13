# Skills 编写与管理机制分析

## 一、Skill 核心概念
把Skill 当成是当前系统的**模块化能力扩展包**，将 AI Agent 从通用助手转变为具有特定领域专长的专家。本质上，Skill 是一个**自包含的知识和工具包**。

### 核心价值主张
1. 多步骤特定领域流程
2. 针对特定文件格式或 API 的操作指南
3. 公司特定知识、schema、业务逻辑
4. 复杂重复任务所需的脚本、参考材料和资产

---

## 二、Skill 结构设计原则
一个 Skill 负责一类业务能力域，比如「web3 钱包分析」确保skill的设计颗粒度不大不小
例如：Skill 里可以包含多个相关函数 / 脚本，但要围绕同一个目标流程，比如“读取数据 → 分析 → 生成报告（Excel/PPT/文本）；确保这里架构设计不要为每个特别小的动作单独做 Skill

### 2.1 标准目录结构
```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter 元数据
│   │   ├── name: (必需)
│   │   ├── description: (必需)这里必须写得准确且具有辨识度
│   │   └── metadata: {clawdbot对象, 可选}
│   └── Markdown 指令内容
└── 可选资源目录
    ├── scripts/          - 可执行代码
    ├── references/       - 参考文档
    └── assets/           - 输出所需资产
```

### 2.2 渐进式披露 (Progressive Disclosure)
系统采用三级加载机制来高效管理上下文：

1. **元数据层** (`name` + `description`) - 始终在上下文中 (~100词)
2. **SKILL.md 主体** - 技能触发后加载 (<5k词)
3. **捆绑资源** - 按需加载 (无限制，因为脚本可执行而不读入上下文)

**关键模式**: 当技能支持多种变体/框架时，SKILL.md 只保留核心流程和选择指南，将具体细节分离到 references 文件中。

---

## 三、编写优秀 Skill 的核心规则

### 规则 1: **简洁至上 (Concise is Key)**
> Context window 是公共资源，默认假设Code/llm已经很聪明
- 挑战每个段落："这段内容值得占用 token 吗？"
- 只添加 AI 不具备的上下文信息

**示例对比**:
# 冗长版本
GitHub CLI 是一个强大的命令行工具，它允许你在终端中执行各种 GitHub 操作。
要使用它，你需要首先确保已经安装并且配置好了认证...

# 简洁版本
Use `gh` CLI to interact with GitHub. Specify `--repo owner/repo` when not in a git directory.
```

### 规则 2: **Appropriate Degrees of Freedom**
| 自由度 | 适用场景 | 实现方式 |
|--------|---------|---------|
| **高** | 多种方法均可行，依赖上下文判断 | 文本指令 |
| **中** | 存在首选模式但允许变化 | 伪代码/带参数脚本 |
| **低** | 操作易错，必须遵循特定顺序 | 具体脚本，少量参数 |

**比喻**: 窄桥需要护栏(低自由度)，开阔田野允许多条路径(高自由度)

### 规则 3: **资源分类清晰**
#### Scripts (`scripts/`)
- **何时使用**: 重复编写同样代码 OR 需要确定性可靠性
- **好处**: token高效、确定性强、可不读入上下文直接执行
- **注意**: 仍可能需要被读取以进行修补或环境适配

#### References ([references/](file:///d:/clawdbot/src/agents/skills.ts#35-46))
- **何时使用**: 需要时读入上下文的文档
- **示例**: API文档、数据库schema、公司政策
- **最佳实践**: 
  - 大文件(>10k词)需在 SKILL.md 中提供 grep 搜索模式
  - 避免重复：信息应存在于 SKILL.md **或** references，不能两者都有

#### Assets (`assets/`)
- **何时使用**: 不读入上下文，直接用于输出的文件
- **示例**: logo、模板、字体、样板代码
- **好处**: 分离输出资源和文档，Codex 可使用文件而不加载到上下文

### 规则 4: **YAML Frontmatter 是触发器**

```yaml
---
name: github
description: "Interact with GitHub using `gh` CLI. Use `gh issue`, `gh pr`, `gh run` for issues, PRs, CI runs."
metadata: {
  "clawdbot": {
    "emoji": "🐙",
    "requires": {
      "bins": ["gh"]
    },
    "install": [{
      "id": "brew",
      "kind": "brew", 
      "formula": "gh",
      "bins": ["gh"],
      "label": "Install GitHub CLI (brew)"
    }]
  }
}
---
```

**关键点**:
- `description` 是**主要触发机制** - 必须包含"做什么"和"何时使用"
- 所有"何时使用"信息必须在 frontmatter，不能在 body（body 触发后才加载）
- `metadata.clawdbot` 定义依赖、安装方式、系统要求

### 规则 5: **避免非必要文件**

不要创建:
- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
仅保留 AI Agent 执行任务所需的信息

---

## 四、Skill 管理与调用机制

### 4.1 Skill 加载优先级

系统从多个位置加载 skills，优先级从低到高：

```
extra < bundled < managed < workspace
```
1. **Extra Skills** - 通过 `config.skills.load.extraDirs` 配置的额外目录
2. **Bundled Skills** - Clawdbot 内置技能 (需 allowlist 白名单)
3. **Managed Skills** - 用户全局安装的技能 (`~/.config/clawdbot/skills`)
4. **Workspace Skills** - 工作区本地技能 (`./skills`)

### 4.2 核心加载流程

// 1. 从各目录加载原始 Skill 对象
loadSkillsFromDir({ dir, source })

// 2. 合并为 SkillEntry (附加元数据)
{
  skill: Skill,
  frontmatter: ParsedSkillFrontmatter,
  clawdbot: ClawdbotSkillMetadata,
  invocation: SkillInvocationPolicy
}

// 3. 过滤符合条件的 skills
filterSkillEntries(entries, config, skillFilter, eligibility)

// 4. 格式化为 prompt 注入上下文
formatSkillsForPrompt(skills)
```



### 4.4 Skill Command 生成

系统可为 skills 自动生成斜杠命令（用于 Discord/Slack 等平台）：

```typescript
buildWorkspaceSkillCommandSpecs() {
  // 1. 命令名标准化 (小写, 替换非字母数字为下划线)
  sanitizeSkillCommandName(raw) → "github_pr"
  
  // 2. 去重处理
  resolveUniqueSkillCommandName(base, used) → "github_pr_2"
  
  // 3. 描述截断 (≤100字符 for Discord)
  
  // 4. Dispatch 模式解析
  if (frontmatter["command-dispatch"] === "tool") {
    dispatch: { kind: "tool", toolName, argMode: "raw" }
  }
}
```

### 4.5 环境变量覆盖

Skills 可在运行时注入环境变量：

applySkillEnvOverrides(snapshot, config) {
  for (const skill of snapshot.skills) {
    const skillConfig = config?.skills?.entries?.[skillKey];
    if (skillConfig?.apiKey && skill.primaryEnv) {
      process.env[skill.primaryEnv] = skillConfig.apiKey;
    }
    if (skillConfig?.env) {
      Object.assign(process.env, skillConfig.env);
    }
  }
}
```

---

## 五、精炼规则总结

### 编写 Skill 的 6 条黄金法则

1. **最小化上下文占用**: 假设 AI 已聪明，只添加独特知识
2. **清晰的触发条件**: `description` 必须详细说明"做什么"和"何时用"
3. **合理的资源分层**: 
   - Scripts = 确定性执行
   - References = 按需文档
   - Assets = 输出素材
4. **渐进式信息披露**: SKILL.md 保持精简(<500行)，细节拆分到 references
5. **明确的依赖声明**: 在 `metadata.clawdbot.requires` 中声明所有依赖
6. **避免冗余文件**: 只保留 AI 执行任务所需的内容

### 管理 Skill 的 4 个关键点

1. **优先级策略**: workspace > managed > bundled > extra
2. **资格检查**: 系统+环境+配置多维度验证
3. **上下文注入**: 通过 `formatSkillsForPrompt` 将 skills 注入系统提示
4. **动态环境**: 运行时从配置注入 API keys 和环境变量

---
## 六、实战示例分析

### 简单技能: `github`
```yaml
name: github
description: "Interact with GitHub using `gh` CLI..."
metadata: {
  "clawdbot": {
    "requires": {"bins": ["gh"]},
    "install": [{"kind": "brew", "formula": "gh"}]
  }
}
```
- 单一依赖 (`gh` 二进制)
- 简洁示例为主
- 无额外资源目录

### 复杂技能: `local-places`
```yaml
name: local-places
description: "Search for places via Google Places API proxy..."
metadata: {
  "clawdbot": {
    "requires": {
      "bins": ["uv"],
      "env": ["GOOGLE_PLACES_API_KEY"]
    },
    "primaryEnv": "GOOGLE_PLACES_API_KEY"
  }
}
```
- 多依赖 (二进制 + 环境变量)
- 包含 `src/` Python 服务代码
- 详细 API 使用流程

### 元技能: `skill-creator`
- 提供创建其他技能的指导
- 包含 `scripts/` 用于初始化和打包
- 详尽文档 (372行) 但无 references (因本身是教学性质)

---

## 七、设计哲学总结

Skill设计遵循以下设计哲学：
1. **模块化与复用**: 技能是独立包，可跨工作区复用
2. **渐进增强**: 从最小元数据到完整资源的三级加载
3. **声明式配置**: 依赖、触发、调用策略全部声明化
4. **环境适配**: 动态检查系统能力，优雅降级
Skill 不是代码库，而是 **AI Agent 的领域知识胶囊**。
