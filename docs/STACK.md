# Stack

Confirmed by the human in GigaLab on 2026-10-22.

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (with Vite) | Components for rich, app-like screens; more to learn, the most examples online |
| Backend | Python: FastAPI | GigaLab's own stack: small, fast and typed; you add sign-in and an admin with libraries |
| Database | SQLite | One file on the server; enough for a few thousand tasks a month on one server with a lasting disk |
| Hosting | One server (VPS) with Docker | Cheapest; you look after updates, backups and HTTPS |
| Extras | none | |

## Commands
- Install: `pip install -r requirements.txt`
- Run the tests: `pytest -q`
- Run the app: `uvicorn app.main:app --reload`

## Who looks after it
- Reads best: JavaScript or TypeScript. Team: Two to five people. Runs a Linux server: Yes. Live updates: Yes: live chat, a live inbox or notifications.

## Two parts
- `web/` is a separate React (with Vite) app that calls the backend’s JSON API, with its own `npm install` and build.

## Checks from GigaLab
- warn: You read JavaScript best, but the backend is Python: you must still review every change the agent makes.
