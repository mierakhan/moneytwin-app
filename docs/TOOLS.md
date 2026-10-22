# Tools and the harness

Shape: **An agent loop with tools**.

| Tool | Kind | Inputs | Used by | Permission |
|---|---|---|---|---|
| `get_transactions` | look-up | start_date, end_date, transaction_type | AI Expense Analysis | allowed: runs by itself |
| `calculate_budget` | calculation | month, category | AI Expense Analysis | allowed: runs by itself |
| `analyze_spending` | calculation | start_month, end_month | AI Expense Analysis | allowed: runs by itself |
| `simulate_finances` | calculation | income, expenses, recurring_cost, spending_cut, income_change, savings_commitment, one_off_purchase, months | Financial Simulation | allowed: runs by itself |
| `calculate_savings_goal` | calculation | goal_id, target_amount, current_amount, target_date | AI Finance Chatbot | allowed: runs by itself |

## `get_transactions`
Retrieve the authenticated user's transactions for a selected date range.
- `start_date`
- `end_date`
- `transaction_type`
- It only reads, for the signed-in tenant. It changes nothing.

## `calculate_budget`
Calculate spending, remaining budgets, and overspending amounts using verified records.
- `month`
- `category`
- It works out a figure in code, never by the AI, for the signed-in tenant.

## `analyze_spending`
Calculate spending patterns, category totals, and monthly comparisons.
- `start_month`
- `end_month`
- It works out a figure in code, never by the AI, for the signed-in tenant.

## `simulate_finances`
Calculate hypothetical financial scenarios without changing saved financial records.
- `income`
- `expenses`
- `recurring_cost`
- `spending_cut`
- `income_change`
- `savings_commitment`
- `one_off_purchase`
- `months`
- It works out a figure in code, never by the AI, for the signed-in tenant.

## `calculate_savings_goal`
Calculate savings progress, remaining target, and required monthly savings.
- `goal_id`
- `target_amount`
- `current_amount`
- `target_date`
- It works out a figure in code, never by the AI, for the signed-in tenant.

## Skill tools (read only, allowed)
- `load_skill(name)`: returns one skill's steps from skills/<name>/SKILL.md (docs/SKILLS.md).
- `read_file(path)`: returns one file of a skill that is already loaded.

## The harness (code, not the prompt)

The AI only proposes a tool call. Code decides. The prompt may say “ask before sending”, but only the harness enforces it: a rule that lives only in the prompt is a suggestion (Module 3’s prompt-only lab).

### Every tool call is checked, in this order
1. The tool exists. An unknown name is refused.
2. The arguments match the tool’s schema. Anything else is refused, with the reason.
3. The tool is under its call limit (5 calls in one run).
4. Its permission: allowed runs; “a person approves” pauses the run and saves its state until someone approves or rejects it; never is refused and logged.
5. It is for the signed-in tenant: a tool only ever sees that customer’s data.

### The run stops
- At 8 steps, 20,000 words (tokens) or 60 seconds, with a clear message to the user: never a half-done answer presented as finished.
- When the AI asks for a tool it may not use: the run stops, and the user is told it needs a person.
- When a tool needs approval: the run pauses, and carries on only after a person decides.

### When something fails
- A tool fails or times out: a person reviews the result before anyone uses it.
- A broken reply, wrong fields or a broken business rule: the failure policy, repair once, then human review (docs/PROMPT_CONTRACT.md).
- The final answer is checked against its contract before it is used: it is used, a person reviews it, or the run stops.

### Every step is recorded
- Step, tool, arguments, the harness’s decision and the result, with the run id and the tenant. Never what people wrote, and never personal data.

## Limits
- max_steps: 8
- max_calls_per_tool: 5
- max_tokens: 20000
- max_seconds: 60
