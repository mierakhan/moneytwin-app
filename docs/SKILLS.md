# Skills

Know-how: **One skill per task, loaded on demand**.

The product's agent holds one skill per task: a folder in `skills/` with a SKILL.md (name, description, numbered steps) and the files its steps refer to.

## How the app loads skills (Module 11)
- The system prompt holds only the skill index: each skill's name and description, about 100 tokens each.
- `load_skill(name)` returns that skill's steps; `read_file(path)` returns one of its files, only after the skill is loaded.
- Shared data, such as the price list, lives in one file that the skills refer to. Never copy prices into a skill.
- The harness logs which skills each request loaded.

## The skills

| Skill | Status |
|---|---|
| `expense-analysis` | to write: skills/expense-analysis/SKILL.md |
| `budget-monitoring` | to write: skills/budget-monitoring/SKILL.md |
| `financial-simulation` | to write: skills/financial-simulation/SKILL.md |
| `savings-goal-planning` | to write: skills/savings-goal-planning/SKILL.md |
| `financial-question-answering` | to write: skills/financial-question-answering/SKILL.md |

## Tests
- Test each skill alone on 3 to 5 sample requests, then the agent.
- The test plan records which skills each request used: a right answer from the wrong skills is a fail.
