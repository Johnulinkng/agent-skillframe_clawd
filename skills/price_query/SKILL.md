---
name: price_query
description: "Quick token price lookup. Returns real-time price, 24h change, and volume. Triggers: price of, how much is, what's the price, XX price"
---

# Price Query

Quickly retrieve real-time token prices and market data.

## Execution Flow

### Step 1: Identify Token

Extract from user input:
- **symbol**: Token symbol (BTC/ETH/SOL)
- **tokenAddress**: Contract address (if provided)
- **network**: Network (infer from context or default to ethereum)

### Step 2: Search Token (if needed)

If only symbol provided without address, call `search_token` to find the token.
Select the most relevant match (verified, highest volume).

### Step 3: Get Price Data

Call `get_token_price` to fetch real-time price and 24h data.

### Step 4: Format Output

Present data in a clean, scannable format:
- Current price
- 24h change (with direction indicator)
- 24h volume (optional)

## Output Format

```
**[TOKEN]** Real-time Price

Price: $XX.XX
24h: +X.XX% / -X.XX%
Volume: $XXM
```

## Few-Shot Examples

### Example 1: Direct Query

**User**: ETH price

**Assistant**: **ETH** Real-time Price

Price: **$3,520.45**
24h: **+2.35%**
Volume: $12.5B

ETH is showing positive momentum today.

---

### Example 2: Conversational Query

**User**: How much is SOL right now?

**Assistant**: Let me check SOL price for you...

**SOL** Real-time Price

Price: **$145.20**
24h: **-1.8%**
Volume: $2.1B

SOL is slightly down today, but within normal range.

---

### Example 3: Lesser-Known Token

**User**: PEPE price

**Assistant**: Let me look up PEPE...

[Call search_token]
[Call get_token_price]

**PEPE** Real-time Price

Price: **$0.00001234**
24h: **+15.6%**
Volume: $890M

PEPE is up significantly! Note: Meme tokens are highly volatile.

## Dependent Tools

- `get_token_price`: Fetch token price
- `search_token`: Search for token by symbol
- `get_token_detail`: Get additional token info (optional)
