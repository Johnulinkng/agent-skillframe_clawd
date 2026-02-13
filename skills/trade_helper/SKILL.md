---
name: trade_helper
description: "Execute crypto buy/sell trades. Flow: balance check -> gas config -> open trade window. Triggers: buy, sell, swap, trade, purchase, long, short"
---

# Trade Helper

Execute cryptocurrency buy and sell operations with proper pre-trade validation.

## Execution Flow

### Step 1: Parse Trade Intent

Extract from user input:
- **symbol**: Token symbol (BTC/ETH/SOL/USDC)
- **side**: BUY or SELL
- **amount**: Amount (optional, e.g., "100U of ETH" or "0.5 BTC")
- **tradeType**: SPOT (default) or CONTRACT
- **network**: Network (default: ethereum)

### Step 2: Balance Check (Critical)

**For BUY**: Call `check_usdc_balance`
- Insufficient balance -> Return `client_action: SHOW_DEPOSIT_PROMPT`, do NOT proceed
- Sufficient balance -> Continue

**For SELL**: Call `get_wallet_balance` to check token holdings
- Insufficient holdings -> Inform user of current balance
- Sufficient holdings -> Continue

### Step 3: Get Transaction Config

Call `get_transaction_settings` to fetch current gas/slippage configuration.
Briefly inform user of estimated fees.

### Step 4: Create Trade Intent

Call `create_trade_intent` returning `client_action: OPEN_TRADE_WINDOW`.
Frontend opens trade window upon receiving this action.

## Critical Rules

> [!CAUTION]
> **Never proceed with trade if balance is insufficient!** Must prompt for deposit first.

- Always check balance before any trade
- For ambiguous amounts (e.g., "100"), ask if USD or token quantity
- For large trades (>1000 USD), add extra caution reminder
- Contract trades require risk warning about liquidation

## Few-Shot Examples

### Example 1: Normal Buy Flow

**User**: Buy $100 of ETH

**Assistant**: Let me prepare your ETH purchase!

First, checking your USDC balance...

[Call check_usdc_balance]

Your USDC balance is sufficient (Current: 500 USDC).

Estimated gas fee: ~0.002 ETH. I've opened the trade window - please confirm the parameters.

[Return client_action: OPEN_TRADE_WINDOW]

---

### Example 2: Insufficient Balance

**User**: Buy $500 of SOL

**Assistant**: Let me check your balance first...

[Call check_usdc_balance]

Your USDC balance is only 120 USDC, which isn't enough for a $500 purchase.

You'll need to deposit more USDC first. I'm opening the deposit interface for you.

[Return client_action: SHOW_DEPOSIT_PROMPT]

---

### Example 3: Sell Holdings

**User**: Sell half of my SOL

**Assistant**: Let me check your SOL holdings...

[Call get_holding_list]

You currently hold 120 SOL (worth ~$17,400 USD).

Selling half means 60 SOL. Opening the trade window now.

[Return client_action: OPEN_TRADE_WINDOW { side: SELL, amount: 60 }]

## Dependent Tools

- `check_usdc_balance`: Pre-trade balance validation
- `get_wallet_balance`: Check token holdings
- `get_holding_list`: List all holdings
- `get_transaction_settings`: Get gas/slippage config
- `create_trade_intent`: Create trade intent
- `sign_and_send_transaction`: Execute transaction (returns CONFIRM_TRANSACTION for user approval)
