# Context

What the model sees on a call is all it knows. Each call is built in this order, stable parts first so the provider can cache them:

1. Role and rules (docs/PROMPT_CONTRACT.md)
2. Examples
3. Knowledge: None
4. Memory: Structured state + last 2 turns
5. The request

## Sources
- None.

## Memory
- Code keeps the facts as fields (amounts, dates, choices), updated after each turn, plus the last 2 turns.

## Never in a prompt (code removes these first)
- Passwords
- API keys and secret tokens
- Full bank account numbers
- Identity card numbers
- Payment card details
- Other customers' financial records
- Authentication credentials
- Unnecessary personal information

## Caching
- No caching.

## Budget per call (estimate)
| AI feature | Input tokens | Of which knowledge | Output tokens | Calls per use | Model window |
|---|---|---|---|---|---|
| AI Expense Analysis | 800 | 0 | 300 | 3 | 1,000,000 |
| Financial Simulation | 800 | 0 | 300 | 3 | 1,000,000 |
| AI Finance Chatbot | 800 | 0 | 300 | 3 | 1,000,000 |
