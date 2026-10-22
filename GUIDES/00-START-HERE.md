# MoneyTwin AI — Start Here

**Purpose:** Give Hermes Agent a complete, actionable implementation specification to build MoneyTwin AI as a functioning local web SaaS prototype, including real AI chatbot integration.

## Use in this order
1. Extract this whole ZIP to a folder Hermes can access on your PC, e.g. `C:\Projects\MoneyTwin-AI`.
2. Open `01-HERMES-MASTER-PROMPT.txt`, copy everything and send to Hermes. Provide the actual folder path.
3. Let Hermes read the other files in this directory. Do **not** paste API keys in the prompt or in chat.
4. Keep Flowise separate from KedaiVolt and previous MoneyTwin workshop flows. Configure a dedicated MoneyTwin Flowise flow, or use a **working server-side AI provider integration** if Flowise is not yet connected. Never silently fake chatbot answers.
5. Ask Hermes to show what it actually implemented, run tests and start the website on localhost.

## Scope and honesty
The specifications in this pack are an actionable implementation proposal derived from the MoneyTwin SaaS Builder planning answers. They are **not** proof the app already exists, nor verified pricing, legal compliance or working API connections. Paid subscriptions can be mocked locally; **no live payment collection** in MVP.

## Files
- `01-HERMES-MASTER-PROMPT.txt`: full copy-paste build instruction.
- `02-PRODUCT-REQUIREMENTS.md`: scope, roles, features, use cases and business rules.
- `03-UI-UX-PAGES.md`: design system, pages and example UI states.
- `04-ARCHITECTURE-DATABASE-API.md`: technical design, schema and API contract.
- `05-AI-CHATBOT-AGENTS-TOOLS.md`: required AI capabilities, safe function tools, prompts and Flowise integration.
- `06-TEST-ACCEPTANCE.md`: end-to-end tests and expected outputs.
- `07-SECURITY-OPERATIONS-DEPLOY.md`: tenant isolation, secrets, Docker, health and logs.
- `08-MVP-PLAN-AND-DECISIONS.md`: roadmap, assumptions, non-goals and definition of done.
- `.env.example`: placeholders only. Copy to `.env` and fill secrets locally; never commit.
- `sample-transactions.csv`: invented demo data for development only.
