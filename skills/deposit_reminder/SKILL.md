---
name: deposit_reminder
description: "Handle insufficient balance scenarios. Auto-triggered when USDC is low for trades. Returns deposit prompt. Triggers: auto on low balance, deposit, add funds"
---

# Deposit Reminder

Handle insufficient balance situations and guide users to deposit funds.

## When This Triggers

Auto-triggered when:
1. User attempts trade but `check_usdc_balance` returns `sufficient: false`
2. User explicitly asks about depositing
3. Balance check during trading flow shows shortfall

## Execution Flow

### Step 1: Acknowledge Shortfall

Inform user clearly but kindly:
- Current balance
- Required amount
- Shortfall amount

### Step 2: Return Deposit Prompt

Return `client_action: SHOW_DEPOSIT_PROMPT`
- Include suggested deposit amount (shortfall + buffer)

### Step 3: Offer Alternatives (Optional)

If user has other assets:
- Suggest swapping tokens to USDC
- Offer to adjust trade amount to match balance

## Output Format

```
Your USDC balance is insufficient.

**Current**: $XX.XX USDC
**Required**: $XX.XX USDC
**Shortfall**: $XX.XX USDC

[Deposit Button] -> client_action: SHOW_DEPOSIT_PROMPT
```

## Few-Shot Examples

### Example 1: Trade Blocked

**User**: Buy $500 of ETH

**Assistant**: Let me check your balance first...

[Call check_usdc_balance with requiredAmount=500]

Your USDC balance is insufficient for this trade.

**Current Balance**: $120.50 USDC
**Trade Amount**: $500.00 USDC
**Need**: $379.50 more

I'm opening the deposit interface - add funds to continue.

[Return client_action: SHOW_DEPOSIT_PROMPT with suggestedAmount=400]

---

### Example 2: Suggest Lower Amount

**User**: I want to buy SOL

**Assistant**: How much SOL would you like?

[After user says $1000 and balance is $200]

You have $200 USDC available. Would you like to:

1. **Deposit more** to buy $1000 worth
2. **Adjust trade** to buy $200 worth with current balance

Let me know what works for you.

---

### Example 3: Direct Deposit Request

**User**: How do I add money?

**Assistant**: I'll help you deposit funds.

Your options:
- **USDC** (recommended for trading)
- **ETH** (for gas fees)
- **Other tokens**

Opening the deposit interface now.

[Return client_action: SHOW_DEPOSIT_PROMPT]

## Critical Rules

> [!CAUTION]
> **Never proceed with trade if balance is insufficient!**

- Be helpful, not judgmental
- Suggest practical alternatives
- Make deposit process smooth

## Dependent Tools

- `check_usdc_balance`: Primary balance check
- `get_wallet_balance`: Check other balances
- `get_holding_list`: Check if user has assets to swap
