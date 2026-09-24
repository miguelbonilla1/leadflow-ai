# n8n workflow: LeadFlow qualification

Create a workflow called **LeadFlow — Qualify and route inquiry**.

## Required credentials

- An OpenAI-compatible API credential stored inside n8n.
- `LEADFLOW_CALLBACK_SECRET`, matching `N8N_CALLBACK_SECRET` in Next.js.
- The deployed application URL.

Never place credentials directly inside exported workflow JSON.

## Nodes

### 1. Webhook

- Method: `POST`
- Path: `leadflow-qualification`
- Authentication: Header/Bearer token
- Expected input: `id`, `name`, `email`, `business_type`, `need`, `budget`, `urgency`, `callbackUrl`

### 2. Normalize input

Use a Code node to trim strings, lowercase the email and reject missing fields. Keep the original `id`; it becomes `leadId` in the callback.

### 3. Business scoring

Calculate a deterministic base score before asking AI:

- Budget: up to 30 points.
- Urgency: up to 25 points.
- Request detail: up to 30 points.
- Valid, complete business context: 15 points.

The AI may explain the result but must not silently replace these rules.

### 4. AI structured analysis

Ask the model to return strict JSON with:

```json
{
  "category": "Lead operations",
  "summary": "Short factual summary",
  "recommended_service": "Lead qualification workflow",
  "next_action": "Review and schedule discovery call",
  "draft_reply": "A concise personalized draft",
  "reasons": ["Reason one", "Reason two", "Reason three"]
}
```

System instruction:

```text
You analyze inbound business requests. Use only the supplied facts. Do not invent
company information, results or urgency. Return valid JSON matching the schema.
Write a helpful draft, but never claim that it has been sent.
```

### 5. Route by score

- `78–100`: `qualified`
- `58–77`: `review`
- `0–57`: `nurture`

Use a Switch node so each route can later notify a different team or schedule a different follow-up.

### 6. Callback

Send `POST {{ callbackUrl }}` with header:

```text
x-callback-secret: {{ $env.LEADFLOW_CALLBACK_SECRET }}
```

Body:

```json
{
  "leadId": "original lead id",
  "score": 82,
  "status": "qualified",
  "category": "Customer operations",
  "summary": "...",
  "recommended_service": "...",
  "next_action": "...",
  "draft_reply": "...",
  "reasons": ["...", "...", "..."]
}
```

### 7. Failure branch

Attach an error workflow that records the lead ID, failed node and timestamp. Do not include API keys, authorization headers or complete customer messages in logs.

## Human approval

The current application deliberately stops at a draft. Add email delivery only after implementing an authenticated approval endpoint and audit log. The n8n workflow must never send the draft automatically.
