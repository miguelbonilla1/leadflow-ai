import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

const validStatuses = ['qualified', 'review', 'nurture', 'archived'];

export async function POST(request: NextRequest) {
  const secret = process.env.N8N_CALLBACK_SECRET;
  const authorization = request.headers.get('authorization');
  const suppliedSecret = request.headers.get('x-callback-secret');
  if (!secret || (suppliedSecret !== secret && authorization !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.leadId !== 'string') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return NextResponse.json({ error: 'Score must be between 0 and 100' }, { status: 400 });
  }

  const status = typeof body.status === 'string' && validStatuses.includes(body.status)
    ? body.status
    : score >= 78 ? 'qualified' : score >= 58 ? 'review' : 'nurture';

  const textFields = ['category', 'summary', 'recommended_service', 'next_action', 'draft_reply'] as const;
  if (textFields.some((field) => typeof body[field] !== 'string')) {
    return NextResponse.json({ error: 'Analysis fields are required' }, { status: 400 });
  }

  const reasons = Array.isArray(body.reasons)
    ? body.reasons.filter((reason): reason is string => typeof reason === 'string').slice(0, 6)
    : [];

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });

  const update = {
    status,
    score: Math.round(score),
    category: (body.category as string).slice(0, 100),
    summary: (body.summary as string).slice(0, 600),
    recommended_service: (body.recommended_service as string).slice(0, 200),
    next_action: (body.next_action as string).slice(0, 300),
    draft_reply: (body.draft_reply as string).slice(0, 2000),
    reasons,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', body.leadId)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Could not update lead' }, { status: 500 });
  return NextResponse.json({ ok: true, lead: data });
}
