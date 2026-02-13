---
name: asset_analyst
description: "Analyze user's crypto portfolio and holdings. Outputs markdown table with balances, values, and 24h changes. Triggers: analyze portfolio, my assets, holdings, check my balance"
---

# Asset Analyst

Analyze user's cryptocurrency holdings and provide portfolio insights.

## Execution Flow

### Step 1: Get Holdings

Call `get_holding_list` to fetch all user token holdings.

### Step 2: Get Real-time Prices

For each holding, call `get_token_price` to get current prices.
Calculate total portfolio value and individual token values.

### Step 3: Generate Analysis Report

Output as markdown table:

| Token | Amount | Price | Value (USD) | 24h Change |
|-------|--------|-------|-------------|------------|

### Step 4: Provide Insights (Optional)

Based on holdings:
- Identify top holding by value
- Calculate diversification ratio
- Note significant 24h movers

## Output Format

```
## Portfolio Analysis

**Total Value**: $XX,XXX.XX

| Token | Amount | Price | Value | 24h |
|-------|--------|-------|-------|-----|
| BTC | 0.5 | $65,000 | $32,500 | +2.1% |
| ETH | 10 | $3,500 | $35,000 | -0.5% |

### Insights
- Top holding: ETH (52%)
- Portfolio is well-diversified
- BTC showing strongest performance today
```

## Few-Shot Examples

### Example 1: Full Analysis

**User**: Analyze my portfolio

**Assistant**: Let me analyze your holdings...

[Call get_holding_list]
[Call get_token_price for each token]

## Portfolio Analysis

**Total Value**: $66,950 USD

| Token | Amount | Price | Value | 24h |
|-------|--------|-------|-------|-----|
| BTC | 0.5 | $64,500 | $32,250 | +1.8% |
| ETH | 8.5 | $3,500 | $29,750 | -0.3% |
| SOL | 35 | $142 | $4,970 | +5.2% |

### Insights
- Top holding: BTC (48.2%)
- Portfolio is moderately diversified across 3 assets
- SOL is your best performer today (+5.2%)

---

### Example 2: Quick Balance Check

**User**: What's my balance?

**Assistant**: Here's your current holdings:

[Call get_holding_list]

| Token | Amount | Value |
|-------|--------|-------|
| USDC | 1,250 | $1,250 |
| ETH | 2.5 | $8,750 |

**Total**: $10,000 USD

## Dependent Tools

- `get_holding_list`: Fetch all token holdings
- `get_token_price`: Get real-time token prices
- `get_wallet_balance`: Get specific token balance
