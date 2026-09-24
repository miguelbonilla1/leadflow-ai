import { NextRequest, NextResponse } from 'next/server';
import { classifyDemoLead, LeadInput } from '@/lib/leadflow';
import { getSupabaseAdmin, isDemoMode } from '@/lib/supabaseServer';

const allowedBudgets = ['Under $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500+', 'Not sure'];
const allowedUrgencies = ['Today', 'This week', 'This month', 'Just exploring'];

function validateLead(payload: unknown): LeadInput | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  const fields = ['name', 'email', 'business_type', 'need', 'budget', 'urgency'] as const;
  if (fields.some((field) => typeof data[field] !== 'string')) return null;

  const input = Object.fromEntries(
    fields.map((field) => [field, (data[field] as string).trim()]),
  ) as unknown as LeadInput;

  if (input.name.length < 2 || input.name.length > 80) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length > 160) return null;
  if (input.business_type.length < 2 || input.business_type.length > 100) return null;
  if (input.need.length < 20 || input.need.length > 1200) return null;
  if (!allowedBudgets.includes(input.budget) || !allowedUrgencies.includes(input.urgency)) return null;
  return input;
}

async function triggerWorkflow(lead: { id: string } & LeadInput) {
  const webhookUrl = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_BEARER_TOKEN
          ? { Authorization: `Bearer ${process.env.N8N_BEARER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        ...lead,
        callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/automation/callback`,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  if (isDemoMode()) return NextResponse.json([]);
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: 'Could not load leads' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const input = validateLead(payload);
  if (!input) {
    return NextResponse.json({ error: 'Please complete every field with valid information.' }, { status: 400 });
  }

  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return NextResponse.json({ lead: classifyDemoLead(input), mode: 'demo' }, { status: 201 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });

  const { data: duplicate } = await supabase
    .from('leads')
    .select('id')
    .eq('email', input.email.toLowerCase())
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json({ error: 'A recent request already exists for this email.' }, { status: 409 });
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ ...input, email: input.email.toLowerCase(), status: 'processing', reasons: [] })
    .select('*')
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Could not create the request.' }, { status: 500 });
  }

  const workflowStarted = await triggerWorkflow({ id: lead.id, ...input });
  if (!workflowStarted) {
    await supabase.from('leads').update({ status: 'review' }).eq('id', lead.id);
    lead.status = 'review';
  }

  return NextResponse.json({ lead, mode: 'live' }, { status: 201 });
}
