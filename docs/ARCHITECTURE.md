src/
├── services/               # [API 层] 负责真实的后端 HTTP 调用
│   ├── api.base.ts         # 基础 Fetch 封装 (处理 Token 和 Header)
│   ├── user.service.ts     # 用户/资产 API
│   └── news.service.ts     # 新闻/分析 API
├── agent/
│   ├── tools/              # [适配层] 将 Service 包装成 Agent Tool
│   │   ├── user.ts         # 引用 user.service
│   │   ├── news.ts         # 引用 news.service
│   │   └── trade.ts        # 交易意图处理
│   ├── tools.ts            # 工具工厂，自动加载 tools/ 下的文件或手动注册
│   └── engine.ts           # 核心循环
skills/                     # [逻辑层] 描述 AI 什么时候用什么工具
├── news_digest/
│   ├── skill.md 
│   ├── ....
├── news_digest/
│   ├── skill.md
│   ├── ....
├── trade_helper/
│   ├── skill.md
│   ├── ....

这里面就按照这个逻辑去进行规范化开发推进
通用的 API 请求	src/services/	保持代码 DRY (Don't Repeat Yourself)，易于维护。
复杂的执行逻辑/脚本	skills/xxx/scripts/	
保证确定性，节省上下文 Token 。

详细的业务规范/文档	skills/xxx/references/	
按需加载，防止 AI 混淆 。

AI 的猫咪口吻逻辑	skills/xxx/SKILL.md	核心指令，触发即加载。