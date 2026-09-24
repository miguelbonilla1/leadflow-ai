# LeadFlow AI

LeadFlow AI is an automated lead-operations case study. A business inquiry starts a real workflow: the application validates and stores the request, n8n coordinates analysis and routing, AI returns structured context, deterministic rules assign priority, and a human reviews the proposed reply before anything is sent.

This is intentionally more than a chatbot. The AI is one step in a repeatable business process.

## Business problem

Small teams commonly receive inquiries through forms, email and messaging apps. Manually copying each request into a CRM, checking whether it is relevant, deciding who should respond and remembering to follow up creates delays and inconsistent service.

LeadFlow turns that fragmented process into one visible pipeline.

## Workflow

```text
Inquiry submitted
       │
       ▼
Validate + detect duplicates
       │
       ▼
Persist in Supabase
       │
       ▼
n8n orchestration
  ├── business scoring rules
  ├── structured AI analysis
  ├── qualification routing
  └── callback with draft response
       │
       ▼
Operations dashboard
       │
       ▼
Human approval before communication
```

## What the demo shows

- Public lead-intake form with validation.
- Qualification queue and status filtering.
- Explainable score instead of an opaque AI decision.
- Business category, recommended service and next action.
- AI-generated response kept as a draft.
- Safe demo mode that never sends an email.
- Live mode with Supabase persistence and n8n callbacks.
- Duplicate protection for repeated email submissions.
- Protected callback endpoint and server-only database access.

## Why n8n is necessary

A chat response only produces text. n8n coordinates events across systems, applies branches and business rules, handles failures, waits for later steps and can schedule follow-up actions. The AI interprets unstructured language; n8n owns the operational process.

## Stack

- Next.js 15, React 19 and TypeScript
- Supabase / PostgreSQL
- n8n workflow automation
- OpenAI-compatible structured output
- Vercel-ready deployment

## Local demo

```bash
git clone https://github.com/miguelbonilla1/leadflow-ai.git
cd leadflow-ai
npm install
cp .env.example .env.local
npm run dev
```

Set `LEADFLOW_DEMO_MODE=true` to run the complete interface with sample data and local deterministic classification. Demo mode does not call Supabase, n8n, AI or email services.

## Live setup

1. Run [`supabase/migrations/001_create_leads.sql`](supabase/migrations/001_create_leads.sql) in a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `LEADFLOW_DEMO_MODE=false`.
4. Add the Supabase service role key only to the server environment.
5. Configure the n8n webhook and callback secrets.
6. Build the n8n workflow described in [`docs/n8n-workflow.md`](docs/n8n-workflow.md).

The service role key must never use a `NEXT_PUBLIC_` prefix or be exposed to the browser.

## API

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/leads` | `GET` | Return the latest qualification queue |
| `/api/leads` | `POST` | Validate, deduplicate and start a workflow |
| `/api/automation/callback` | `POST` | Receive the protected structured analysis from n8n |

## Safety decisions

- The public browser never connects directly to the database.
- Anonymous database access is revoked by the migration.
- n8n must authenticate when returning an analysis.
- AI output is constrained and validated before persistence.
- Suggested messages are drafts; sending requires a separate human-approved action.
- Demo records use fictional contact information.

## Roadmap

- Add authenticated workspaces and team roles.
- Add an auditable workflow-events table.
- Add retry and dead-letter handling for failed automations.
- Connect a sandbox email provider for approved demo messages.
- Add API integration tests and workflow monitoring.

Built by [Miguel Bonilla](https://github.com/miguelbonilla1) as a portfolio case study in full-stack development and workflow automation.
