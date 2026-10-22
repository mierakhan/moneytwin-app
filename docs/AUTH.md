# Authentication and authorization

## Authentication: who you are
- Email magic link
- Google sign-in

Options:
- Verify the email address
- Slow down and lock out after failed sign-ins
- Two-factor sign-in for owners and admins
- See and end sessions on other devices
- Use a proven library or auth service; never store a password yourself.
- Sessions are secure, HTTP-only cookies; sign-out ends the session on the server.

## Authorization: what you may do
- Deny by default: a route with no rule below is refused.
- Check the permission on the server, on every request; pages only hide what the server already refuses.
- Tenants: One database, tenant id on every row and key. Every row and key carries the tenant id, and every query filters by it. This is always on.

| Permission | Owner | Administrator |
|---|---|---|
| Expense Tracking | yes | — |
| Budget Management | yes | — |
| AI Expense Analysis | yes | — |
| Financial Simulation | yes | — |
| Savings Goal Tracker | yes | — |
| AI Finance Chatbot | yes | — |
| Overspending Alerts | yes | — |
| Financial Dashboard | yes | — |
| Expense CSV Import | yes | — |
| Manage team and roles | — | yes |
| Billing and plan | yes | yes |
| Business settings | — | yes |
| AI settings | yes | yes |
| Usage and logs | yes | yes |
| Export data | yes | — |

Options:
- Audit log: who changed what, and when
