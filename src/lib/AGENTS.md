# src/lib - Shared Libraries

## insforge.ts
- Insforge BaaS client (REST API + Auth)
- Import: `import { insforgeClient, insforgeAuth } from "@/lib/insforge"`
- Types: `InsforgeResponse<T>`, `InsforgeError`, `AuthTokens`, `UserRecord`, `Row`
- REST: `insforgeClient.from("table").select<T>(token, query)` — query uses PostgREST syntax
- Auth: `insforgeAuth.login(email, password)` returns `InsforgeResponse<AuthTokens>`
- All methods return `{ data, error }` — always check `error` before using `data`
- Email: `insforgeEmail.send({ to, subject, html })` — sends via Insforge Email (AWS SES)
- Import email: `import { insforgeEmail } from "@/lib/insforge"`
- `INSFORGE_API_KEY` is server-only — never import in client components
- `NEXT_PUBLIC_INSFORGE_URL` is safe for client use
