# API 开发文档

**基础信息**
- 服务器地址: `http://tbo.mydex.io/app-api`
- 认证方式: Bearer Token (JWT)
- 在请求头中添加: `Authorization: Bearer <your_token>`

**响应格式说明**
所有接口统一返回格式:
```json
{
  "code": 200,           // 状态码
  "message": "成功",      // 提示信息
  "data": {},            // 响应数据
  "timestamp": 1234567890, // 响应时间戳
  "path": "/api/path"    // 请求路径
}
```

---

## 接口列表 (共70个左右)

### 一、钱包连接管理 (Wallet-Connect)

#### 1. 获取钱包连接列表
**接口**: `GET /wallet-connect`  
**描述**: 列表查询钱包连接信息  
**需要认证**: 是

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "walletAddress": "0x...",
      "network": "ethereum",
      "createdAt": "2024-01-01T00:00:00"
    }
  ]
}
```

---

#### 2. 创建钱包连接
**接口**: `POST /wallet-connect`  
**描述**: 创建新的钱包连接  
**需要认证**: 是

**请求体**:
```json
{
  "walletAddress": "string",  // 必填 - 钱包地址
  "network": "string",        // 必填 - 网络名称
  "signature": "string"       // 必填 - 签名
}
```

**字段说明**:
- `walletAddress` (必填): 钱包地址
- `network` (必填): 网络类型 (如: ethereum, bsc, polygon等)
- `signature` (必填): 钱包签名

---

#### 3. 删除钱包连接
**接口**: `POST /wallet-connect/delete`  
**描述**: 删除指定的钱包连接  
**需要认证**: 是

**请求体**:
```json
[1, 2, 3]  // 数组,包含要删除的ID列表
```

**字段说明**:
- 传入整数数组,每个元素是要删除的钱包连接ID

---

#### 4. 批量创建钱包连接
**接口**: `POST /wallet-connect/batch`  
**描述**: 批量创建多个钱包连接  
**需要认证**: 是

**请求体**:
```json
[
  {
    "walletAddress": "string",
    "network": "string"
  },
  {
    "walletAddress": "string",
    "network": "string"
  }
]
```

**字段说明**:
- 传入数组,每个对象包含 `walletAddress` 和 `network`

---

### 二、交易管理 (Transaction)

#### 5. 获取交易配置
**接口**: `GET /transaction/settings`  
**描述**: 获取交易配置列表,默认提供4条固定配置  
**需要认证**: 是

**重要说明**:
- `toAddress` 没传时 `gasLimit` 给出固定值
- `slippage` 单位为全精度,需自行转为百分数
- **EVM链**: 手续费估算 = (gasPrice × gasLimit) / 10^18, gasPrice单位: 1Gwei = 10^9 wei
- **SOL链**: gas单位 Lamport = 10^9
- 参数 `toAddress` 和 `data` 如果传参,必须捆绑一起传

**请求参数**:
- `network` (必填, query): 网络名称
- `fromAddress` (必填, query): 发送地址
- `toAddress` (选填, query): 接收地址
- `data` (选填, query): 调用数据或合约字节码

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "index": 0,
      "gasPrice": "20000000000",
      "gasLimit": "21000",
      "slippage": "0.005",
      "enabled": true
    }
  ]
}
```

---

#### 6. 修改交易配置
**接口**: `POST /transaction/settings`  
**描述**: 修改交易配置,每次提交一组配置  
**需要认证**: 是

**重要说明**:
- 通过 `network` + `index` 指定配置组
- 启用某组配置时,其他组会失效
- 如失效所有组,默认启用第[0]组

**请求体**:
```json
{
  "network": "string",     // 必填 - 网络
  "index": 0,              // 必填 - 配置索引(0-3)
  "gasPrice": "string",    // 选填 - gas价格
  "gasLimit": "string",    // 选填 - gas限制
  "slippage": "string",    // 选填 - 滑点
  "enabled": true          // 选填 - 是否启用
}
```

---

### 三、话题管理 (Topic)

#### 7. 关注话题
**接口**: `POST /topic/follow/{id}`  
**描述**: 关注指定话题  
**需要认证**: 是

**路径参数**:
- `id` (必填): 话题ID

---

#### 8. 取消关注话题
**接口**: `POST /topic/unfollow/{id}`  
**描述**: 取消关注指定话题  
**需要认证**: 是

**路径参数**:
- `id` (必填): 话题ID


---

#### 10. 获取话题列表
**接口**: `GET /topic`  
**描述**: 获取话题列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码,默认1
- `size` (选填, query): 每页数量,默认20
- `keyword` (选填, query): 搜索关键词

---

#### 11. 获取话题详情
**接口**: `GET /topic/detail/{topicId}`  
**描述**: 获取指定话题的详细信息  
**需要认证**: 是

**路径参数**:
- `topicId` (必填): 话题ID

---

#### 12. 获取关注的话题
**接口**: `GET /topic/following`  
**描述**: 获取当前用户关注的话题列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量

---

#### 13. 获取话题历史
**接口**: `GET /topic/history`  
**描述**: 获取话题浏览历史  
**需要认证**: 是

---

#### 14. 获取话题代币持仓
**接口**: `GET /topic/token-holding`  
**描述**: 获取话题相关的代币持仓信息  
**需要认证**: 是

---

### 四、代币管理 (Token)

#### 15. 获取关注的代币列表
**接口**: `GET /token/follow`  
**描述**: 获取用户关注的代币列表(没有鉴权时也返回空列表)  
**需要认证**: 否(建议登录)

**请求参数**:
- `network` (选填, query): 链网络类型 (sol/eth等)
- `sortType` (选填, query): 排序类型
  - `VOLUME_USD` - 交易量
  - `MARKET_CAP` - 市值
  - `PRICE` - 价格
  - `PERCENTAGE` - 涨跌幅
  - `UPDATE_TIME` - 关注时间
- `sortAsc` (选填, query): 排序方式 (true=升序, false=降序)
- `page` (选填, query): 页码,最小值1
- `size` (选填, query): 每页数量,范围1-100

---

#### 16. 关注代币
**接口**: `POST /token/follow`  
**描述**: 关注指定代币  
**需要认证**: 是

**请求体**:
```json
{
  "tokenAddress": "string",  // 必填 - 代币地址
  "network": "string"        // 必填 - 网络
}
```

---

#### 17. 取消关注代币
**接口**: `DELETE /token/follow`  
**描述**: 取消关注指定代币  
**需要认证**: 是

**请求体**:
```json
{
  "tokenAddress": "string",  // 必填 - 代币地址
  "network": "string"        // 必填 - 网络
}
```

---

#### 18. 批量关注代币
**接口**: `POST /token/followBatch`  
**描述**: 批量关注多个代币  
**需要认证**: 是

**请求体**:
```json
[
  {
    "tokenAddress": "string",
    "network": "string"
  }
]
```

---

#### 19. 获取代币列表
**接口**: `GET /token`  
**描述**: 获取代币列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量
- `network` (选填, query): 网络筛选

---

#### 18. 获取热门代币
**接口**: `GET /token/hot`  
**描述**: 获取热门代币列表  
**需要认证**: 是

---

#### 19. 获取代币关注状态
**接口**: `GET /token/follow/status`  
**描述**: 获取代币的关注状态  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络

---

#### 20. DEX搜索代币
**接口**: `GET /token/dex/search`  
**描述**: 在DEX中搜索代币  
**需要认证**: 是

**请求参数**:
- `keyword` (必填, query): 搜索关键词
- `network` (选填, query): 网络

---

#### 21. 获取代币警告列表
**接口**: `GET /token/warning/list`  
**描述**: 获取代币风险警告列表  
**需要认证**: 是

---

#### 22. 广播代币警告
**接口**: `POST /token/warning/broadcast`  
**描述**: 广播代币风险警告  
**需要认证**: 是

---

### 五、安全检测 (Security)

#### 23. 代币安全检测
**接口**: `POST /security/token_security`  
**描述**: 检测代币合约安全性  
**需要认证**: 是

**请求体**:
```json
{
  "tokenAddress": "string",  // 必填 - 代币地址
  "network": "string"        // 必填 - 网络
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "isHoneypot": false,
    "buyTax": "0",
    "sellTax": "0",
    "riskLevel": "low"
  }
}
```

---

### 六、搜索功能 (Search)

#### 24. 全局搜索
**接口**: `GET /search`  
**描述**: 全局搜索功能,搜索代币、合约、话题等  
**需要认证**: 是

**请求参数**:
- `keyword` (必填, query): 搜索关键词
- `type` (选填, query): 搜索类型 (token/contract/topic/all)
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量

---

### 七、用户资料 (Profiles)

#### 25. 获取用户资料
**接口**: `GET /profiles/profile`  
**描述**: 获取当前用户资料  
**需要认证**: 是



### 八、Privy集成 (Privy)

#### 29. 签名并发送交易
**接口**: `POST /privy/sign-and-send-transaction`  
**描述**: 使用Privy签名并发送交易  
**需要认证**: 是

**请求体**:
```json
{
  "network": "string",       // 必填 - 网络
  "from": "string",          // 必填 - 发送地址
  "to": "string",            // 必填 - 接收地址
  "value": "string",         // 必填 - 金额
  "data": "string",          // 选填 - 交易数据
  "gasPrice": "string",      // 选填 - gas价格
  "gasLimit": "string"       // 选填 - gas限制
}
```

---

#### 30. ETH签名类型数据
**接口**: `POST /privy/ethSignTypedData`  
**描述**: ETH类型化数据签名  
**需要认证**: 是

**请求体**:
```json
{
  "address": "string",  // 必填 - 签名地址
  "message": {}         // 必填 - 类型化消息对象
}
```

---

#### 31. ETH RPC调用
**接口**: `POST /privy/ethCallRpc`  
**描述**: 执行ETH RPC调用  
**需要认证**: 是

**请求体**:
```json
{
  "method": "string",   // 必填 - RPC方法名
  "params": []          // 必填 - 参数数组
}
```

---

### 九、积分任务 (Point Task)

#### 32. 签到
**接口**: `POST /pointTask/checkIn`  
**描述**: 每日签到获取积分  
**需要认证**: 是

---

#### 33. 领取积分奖励
**接口**: `POST /pointTask/claimPointReward`  
**描述**: 领取积分奖励  
**需要认证**: 是

**请求体**:
```json
{
  "taskId": 0  // 必填 - 任务ID
}
```

---

#### 34. 获取签到数据
**接口**: `GET /pointTask/getCheckInData`  
**描述**: 获取签到数据和记录  
**需要认证**: 是

---

#### 35. 获取任务汇总列表
**接口**: `GET /pointTask/getTaskSummaryList`  
**描述**: 获取所有任务的汇总信息  
**需要认证**: 是

---

### 十、列表管理 (Listing)

#### 36. 获取列表
**接口**: `GET /listing`  
**描述**: 获取列表数据  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量
- `type` (选填, query): 列表类型

---

#### 37. 获取列表详情
**接口**: `GET /listing/details`  
**描述**: 获取列表项详细信息  
**需要认证**: 是

**请求参数**:
- `id` (必填, query): 列表项ID

---

#### 38. 获取关注的列表
**接口**: `GET /listing/following`  
**描述**: 获取关注的列表  
**需要认证**: 是



#### 43. 查看列表项
**接口**: `POST /listing/view`  
**描述**: 记录查看列表项  
**需要认证**: 是

**请求体**:
```json
{
  "id": 0  // 必填 - 列表项ID
}
```

---

### 十一、合约管理 (Contract)

#### 44. 关注合约
**接口**: `POST /contract/follow/{id}`  
**描述**: 关注指定合约  
**需要认证**: 是

**路径参数**:
- `id` (必填): 合约ID

---

#### 45. 取消关注合约
**接口**: `POST /contract/unfollow/{id}`  
**描述**: 取消关注合约  
**需要认证**: 是

**路径参数**:
- `id` (必填): 合约ID

---

#### 46. 批量关注合约
**接口**: `POST /contract/batchFollow`  
**描述**: 批量关注多个合约  
**需要认证**: 是

**请求体**:
```json
[
  {
    "contractAddress": "string",
    "network": "string"
  }
]
```

---

#### 47. 获取合约列表
**接口**: `GET /contract/list`  
**描述**: 获取合约列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量
- `network` (选填, query): 网络

---

#### 48. 获取合约详情
**接口**: `GET /contract/detail/{coinName}`  
**描述**: 获取合约详细信息  
**需要认证**: 是

**路径参数**:
- `coinName` (必填): 币种名称

---

#### 49. 获取热门合约
**接口**: `GET /contract/hot`  
**描述**: 获取热门合约列表  
**需要认证**: 是

---

#### 50. 获取关注的合约
**接口**: `GET /contract/following`  
**描述**: 获取关注的合约列表  
**需要认证**: 是

---

#### 51. 获取合约权限
**接口**: `GET /contract/permission`  
**描述**: 获取合约权限信息  
**需要认证**: 是

**请求参数**:
- `contractAddress` (必填, query): 合约地址
- `network` (必填, query): 网络

---

#### 52. 获取合约L2订单簿
**接口**: `GET /contract/l2book`  
**描述**: 获取L2订单簿数据  
**需要认证**: 是

**请求参数**:
- `contractAddress` (必填, query): 合约地址
- `network` (必填, query): 网络

---

#### 53. 获取合约K线
**接口**: `GET /contract/candle`  
**描述**: 获取合约K线数据  
**需要认证**: 是

**请求参数**:
- `contractAddress` (必填, query): 合约地址
- `network` (必填, query): 网络
- `interval` (必填, query): 时间间隔 (1m/5m/15m/1h/4h/1d等)
- `limit` (选填, query): 数据条数

---

#### 54. 获取合约最近交易
**接口**: `GET /contract/recent_trade`  
**描述**: 获取合约最近的交易记录  
**需要认证**: 是

**请求参数**:
- `contractAddress` (必填, query): 合约地址
- `network` (必填, query): 网络
- `limit` (选填, query): 数据条数

---

#### 55. 获取合约趋势K线
**接口**: `GET /contract/trendCandles`  
**描述**: 获取合约趋势K线数据  
**需要认证**: 是

**请求参数**:
- `contractAddress` (必填, query): 合约地址
- `network` (必填, query): 网络

---

### 十二、采集功能 (Collection)

#### 56. AI分析师
**接口**: `POST /collection/ai_analyst`  
**描述**: AI分析师功能  
**需要认证**: 是

**请求体**:
```json
{
  "query": "string",     // 必填 - 分析查询内容
  "network": "string",   // 选填 - 网络
  "tokenAddress": "string"  // 选填 - 代币地址
}
```

---

#### 57. AI订单
**接口**: `POST /collection/ai_order`  
**描述**: AI订单功能  
**需要认证**: 是

**请求体**:
```json
{
  "instruction": "string",  // 必填 - 订单指令
  "network": "string",      // 必填 - 网络
  "amount": "string"        // 必填 - 金额
}
```

---

#### 58. 发送交易
**接口**: `POST /collection/tx/send`  
**描述**: 发送交易  
**需要认证**: 是

**请求体**:
```json
{
  "network": "string",    // 必填 - 网络
  "from": "string",       // 必填 - 发送地址
  "to": "string",         // 必填 - 接收地址
  "value": "string",      // 必填 - 金额
  "data": "string",       // 选填 - 交易数据
  "gasPrice": "string",   // 选填 - gas价格
  "gasLimit": "string"    // 选填 - gas限制
}
```

---

### 十三、认证授权 (Auth)

---

#### 61. 钱包登录
**接口**: `POST /auth/login-by-wallet`  
**描述**: 使用钱包签名登录  
**需要认证**: 否

**请求体**:
```json
{
  "walletAddress": "string",  // 必填 - 钱包地址
  "signature": "string",      // 必填 - 签名
  "message": "string",        // 必填 - 签名消息
  "network": "string"         // 必填 - 网络
}
```


---

#### 64. Google登录
**接口**: `POST /auth/login-by-google`  
**描述**: 使用Google账号登录  
**需要认证**: 否

**请求体**:
```json
{
  "code": "string",          // 必填 - Google OAuth code
  "redirectUri": "string"    // 必填 - 重定向URI
}
```

---

#### 65. 获取Google授权URL
**接口**: `GET /auth/google-auth-url`  
**描述**: 获取Google OAuth授权URL  
**需要认证**: 否

**请求参数**:
- `redirectUri` (必填, query): 回调地址

---

#### 66. Discord登录
**接口**: `POST /auth/login-by-discord`  
**描述**: 使用Discord账号登录  
**需要认证**: 否

**请求体**:
```json
{
  "code": "string",          // 必填 - Discord OAuth code
  "redirectUri": "string"    // 必填 - 重定向URI
}
```

---

#### 70. 普通登录
**接口**: `POST /auth/login`  
**描述**: 使用用户名密码登录  
**需要认证**: 否

**请求体**:
```json
{
  "username": "string",  // 必填 - 用户名/邮箱/手机号
  "password": "string"   // 必填 - 密码
}
```

---

#### 71. 获取用户信息
**接口**: `GET /auth/profile`  
**描述**: 获取当前登录用户信息  
**需要认证**: 是

---

### 十四、Zendesk通知

#### 72. 获取通知列表
**接口**: `GET /zendesk/notices`  
**描述**: 获取系统通知列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量
- `read` (选填, query): 是否已读 (true/false)

---

### 十五、钱包管理 (Wallet)

#### 73. 获取代币余额
**接口**: `GET /wallet/token/balance`  
**描述**: 获取钱包代币余额  
**需要认证**: 是

**请求参数**:
- `walletAddress` (必填, query): 钱包地址
- `network` (必填, query): 网络
- `tokenAddress` (选填, query): 代币地址,不传则查询原生币

---

#### 74. 获取持仓分页
**接口**: `GET /wallet/token/holdingPage`  
**描述**: 分页获取钱包持仓信息  
**需要认证**: 是

**请求参数**:
- `walletAddress` (必填, query): 钱包地址
- `network` (必填, query): 网络
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量

---

#### 75. 获取持仓列表
**接口**: `GET /wallet/token/holding`  
**描述**: 获取钱包持仓列表  
**需要认证**: 是

**请求参数**:
- `walletAddress` (必填, query): 钱包地址
- `network` (必填, query): 网络

---

#### 76. 获取交易历史
**接口**: `GET /wallet/token/tx/history`  
**描述**: 获取钱包交易历史  
**需要认证**: 是

**请求参数**:
- `walletAddress` (必填, query): 钱包地址
- `network` (必填, query): 网络
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量
- `tokenAddress` (选填, query): 代币地址筛选

---

### 十六、市场数据 (Market)

#### 77. 获取代币详情
**接口**: `GET /market/token/detail`  
**描述**: 获取代币市场详细信息  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络

---

#### 78. 获取代币24小时数据
**接口**: `GET /market/token/24h`  
**描述**: 获取代币24小时统计数据  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络

---

#### 79. 获取代币K线
**接口**: `GET /market/token/kline`  
**描述**: 获取代币K线数据  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络
- `interval` (必填, query): 时间间隔 (1m/5m/15m/30m/1h/4h/1d/1w)
- `limit` (选填, query): 数据条数,默认100

---

#### 80. 获取代币蜡烛图
**接口**: `GET /market/token/candles`  
**描述**: 获取代币蜡烛图数据  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络
- `interval` (必填, query): 时间间隔

---

#### 81. 获取代币池信息V2
**接口**: `GET /market/token/poolsV2`  
**描述**: 获取代币流动性池信息(V2版本)  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络

---

#### 82. 获取代币池信息
**接口**: `GET /market/token/pools`  
**描述**: 获取代币流动性池信息  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络

---

#### 83. 获取最新交易
**接口**: `GET /market/token/tradeLatest`  
**描述**: 获取代币最新交易记录  
**需要认证**: 是

**请求参数**:
- `tokenAddress` (必填, query): 代币地址
- `network` (必填, query): 网络
- `limit` (选填, query): 数据条数

---

#### 84. 获取钱包地址代币交易
**接口**: `GET /market/walletAddress/token/trade`  
**描述**: 获取指定钱包地址的代币交易  
**需要认证**: 是

**请求参数**:
- `walletAddress` (必填, query): 钱包地址
- `network` (必填, query): 网络
- `tokenAddress` (必填, query): 代币地址

---

#### 85. 获取合约详情
**接口**: `GET /market/contract/detail/{coinName}`  
**描述**: 获取合约市场详情  
**需要认证**: 是

**路径参数**:
- `coinName` (必填): 币种名称

---

#### 86. 获取合约蜡烛图
**接口**: `GET /market/contract/candle`  
**描述**: 获取合约蜡烛图数据  
**需要认证**: 是

**请求参数**:
- `coinName` (必填, query): 币种名称
- `interval` (必填, query): 时间间隔

---

#### 87. 获取合约L2订单簿
**接口**: `GET /market/contract/l2book`  
**描述**: 获取合约L2订单簿  
**需要认证**: 是

**请求参数**:
- `coinName` (必填, query): 币种名称

---

#### 88. 获取合约列表
**接口**: `GET /market/contract/list`  
**描述**: 获取合约市场列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量

---

#### 89. 获取合约权限
**接口**: `GET /market/contract/permission`  
**描述**: 获取合约交易权限  
**需要认证**: 是

**请求参数**:
- `coinName` (必填, query): 币种名称

---

#### 90. 获取合约最新交易
**接口**: `GET /market/contract/tradeLatest`  
**描述**: 获取合约最新交易  
**需要认证**: 是

**请求参数**:
- `coinName` (必填, query): 币种名称
- `limit` (选填, query): 数据条数

---

### 十七、协议管理 (Protocol)

#### 91. 获取协议详情
**接口**: `GET /protocol/detail`  
**描述**: 获取协议详细信息  
**需要认证**: 是

**请求参数**:
- `id` (必填, query): 协议ID

---

#### 92. 获取协议分页列表
**接口**: `GET /protocol/page`  
**描述**: 分页获取协议列表  
**需要认证**: 是

**请求参数**:
- `page` (选填, query): 页码
- `size` (选填, query): 每页数量
- `category` (选填, query): 分类筛选

---

### 十八、通用配置 (Common)

#### 93. 获取通用配置
**接口**: `GET /common/config`  
**描述**: 获取应用通用配置信息  
**需要认证**: 否

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "chains": [
      {
        "id": "ethereum",
        "name": "Ethereum",
        "nativeCurrency": "ETH",
        "rpcUrl": "https://...",
        "blockExplorerUrl": "https://etherscan.io"
      }
    ]
  }
}
```

---

#### 94. 获取链类型列表
**接口**: `GET /common/chainTypes`  
**描述**: 获取支持的区块链类型列表  
**需要认证**: 否

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "Ethereum",
      "code": "ethereum",
      "networkId": "1",
      "caipNetworkId": "eip155:1",
      "addressUrl": "https://etherscan.io/address/{address}",
      "txUrl": "https://etherscan.io/tx/{hash}"
    }
  ]
}
```




## 附录

### 通用响应码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权,需要登录 |
| 403 | 禁止访问,权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 认证说明

**Bearer Token认证方式**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

大部分接口需要在请求头中携带JWT Token,通过登录接口获取Token后,在后续请求中使用。

### 网络参数说明

常用网络标识:
- `ethereum` - 以太坊主网
- `bsc` - 币安智能链
- `polygon` - Polygon网络
- `arbitrum` - Arbitrum网络
- `optimism` - Optimism网络
- `solana` - Solana网络
- `base` - Base网络

### 分页参数说明

支持分页的接口通用参数:
- `page`: 页码,从1开始
- `size`: 每页数量,默认20,最大100

### Gas相关计算

**EVM链**:
- 手续费 = (gasPrice × gasLimit) / 10^18
- gasPrice单位: 1 Gwei = 10^9 wei

**Solana链**:
- gas单位: 1 Lamport = 10^-9 SOL

### 开发建议

1. **错误处理**: 所有请求都应处理各种HTTP状态码和业务错误码
2. **重试机制**: 对于网络错误建议实现指数退避重试
3. **Token刷新**: Token过期时应使用refreshToken获取新Token
4. **请求限流**: 注意接口调用频率限制,避免被限流
5. **数据验证**: 前端应对用户输入进行基本验证后再提交

---

**文档版本**: v1.0  
**最后更新**: 2026-02-03
**API版本**: v0
