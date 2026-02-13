---
name: news_digest
description: "Get and analyze crypto news with AI insights. Returns topic summaries, sentiment, and related tokens. Triggers: news, latest news, what's happening with, any updates on"
---

# News Digest

Retrieve and analyze cryptocurrency news and market topics with AI insights.

## Execution Flow

### Step 1: Identify Query Type

Extract from user input:
- **keyword**: Token symbol or topic (BTC/ETH/DeFi/NFT)
- **type**: General market news or token-specific
- **depth**: Quick summary or detailed analysis

### Step 2: Get Topics/News

Based on query type:
- General: Call `get_hot_topics` for trending news
- Token-specific: Call `get_topic_list` with filter
- Detailed: Call `get_topic_detail` for full content

### Step 3: AI Analysis (Optional)

For deeper analysis:
- Call `get_ai_analysis` with query
- Returns sentiment, impact score, related tokens

### Step 4: Format Output

Present news digestibly:
- Headline and summary
- Sentiment indicator
- Related tokens
- Key takeaways

## Output Format

```
## Crypto News Digest

### [Headline]
[Summary]

**Sentiment**: Bullish / Bearish / Neutral
**Related**: BTC, ETH
**Impact**: 7/10
```

## Few-Shot Examples

### Example 1: General News

**User**: What's the latest crypto news?

**Assistant**: Here are the top stories:

[Call get_hot_topics]

## Crypto News Digest

### Bitcoin ETF Sees Record Inflows
Spot Bitcoin ETFs recorded $500M daily inflows, signaling institutional demand.

**Sentiment**: Bullish
**Related**: BTC
**Impact**: 8/10

---

### Ethereum L2 TVL Hits New High
Total value locked in L2s surpasses $30B as adoption accelerates.

**Sentiment**: Bullish
**Related**: ETH, ARB, OP
**Impact**: 7/10

---

### Example 2: Token-Specific News

**User**: Any news about SOL?

**Assistant**: Let me check Solana news...

[Call get_topic_list with filter=SOL]

## SOL News Update

### Solana Network Upgrade Announced
New update promises 10x throughput, scheduled for Q2.

**AI Analysis**:
- Sentiment: **Bullish**
- Technical improvement could attract more DeFi projects
- Short-term: Positive catalyst for price

**Related**: SOL, RAY, JUP

## Dependent Tools

- `get_topic_list`: Get news topics
- `get_topic_detail`: Get full topic content
- `get_hot_topics`: Get trending topics
- `get_ai_analysis`: AI market analysis
