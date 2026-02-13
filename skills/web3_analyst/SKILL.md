---
name: web3_analyst
description: "Analyze on-chain wallet data and transaction history. Provides portfolio breakdown, transaction patterns, and insights. Triggers: analyze wallet, on-chain analysis, transaction history, wallet analysis"
---

# Web3 Analyst

Analyze on-chain wallet data, transaction history, and provide blockchain insights.

## Execution Flow

### Step 1: Get Wallet Data

Call `get_wallet_balance` to fetch wallet balances across networks.
Call `get_holding_list` to get all token holdings.

### Step 2: Get Transaction History

Call `get_tx_history` to fetch recent transactions.
Analyze patterns: frequency, types, common interactions.

### Step 3: Generate Analysis

Provide comprehensive on-chain analysis:
- Portfolio distribution
- Transaction patterns
- Network activity
- Risk indicators

## Output Format

```
## On-Chain Analysis

### Portfolio (Total: $XX,XXX)
| Token | Balance | Value | Network |
|-------|---------|-------|---------|

### Recent Activity
- X transactions in last 7 days
- Most used network: Ethereum
- Common interaction: Uniswap

### Insights
- Portfolio concentration
- Activity trends
- Suggestions
```

## Few-Shot Examples

### Example 1: Full Wallet Analysis

**User**: Analyze my wallet

**Assistant**: Running on-chain analysis...

[Call get_holding_list]
[Call get_tx_history]

## On-Chain Analysis

### Portfolio Summary
**Total Value**: $45,230 USD

| Token | Amount | Value | Network |
|-------|--------|-------|---------|
| ETH | 5.2 | $18,200 | Ethereum |
| USDC | 15,000 | $15,000 | Ethereum |
| SOL | 85 | $12,030 | Solana |

### Transaction Activity (Last 30 Days)
- **Total Transactions**: 28
- **Most Active Network**: Ethereum (18 txs)
- **Common Actions**: Swap (12), Transfer (10), Approve (6)

### Insights
1. Portfolio is well-diversified across 3 networks
2. High swap activity suggests active trading
3. Consider moving some ETH to L2 for lower fees

---

### Example 2: Transaction History

**User**: Show my recent transactions

**Assistant**: Here's your transaction history:

[Call get_tx_history]

### Recent Transactions

| Time | Type | Token | Amount | Network |
|------|------|-------|--------|---------|
| 2h ago | Swap | ETH->USDC | 0.5 ETH | Ethereum |
| 1d ago | Transfer | USDC | 500 | Polygon |
| 3d ago | Swap | SOL->USDC | 20 SOL | Solana |

**Summary**: 3 transactions, 2 swaps, 1 transfer

## Dependent Tools

- `get_wallet_balance`: Get wallet balances
- `get_holding_list`: Get all holdings
- `get_tx_history`: Get transaction history
- `get_token_price`: Get current prices
