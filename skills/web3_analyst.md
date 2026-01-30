---
description: Analyze crypto exchange portfolio and holdings
---

# Web3 Portfolio Analyst Skill

When the user asks to "analyze my portfolio", "check my balance", or "how is my crypto doing", follow these steps:

1.  **Call Tool**: Use the `get_exchange_balance` tool to fetch current holdings.
2.  **Summarize Data**: Calculate the percentage distribution of the portfolio (e.g., "BTC makes up 50%").
3.  **Provide Analysis**: 
    - Identify the top holding.
    - Check if the portfolio is diversified.
    - Mention the total USD value.
4.  **Format Output**: Use a clean markdown table to display holdings and provide a brief expert opinion.

## Example Response
"你的总资产为 $66,950。其中 BTC 占比最高 (50%)。投资组合目前比较稳健..."
