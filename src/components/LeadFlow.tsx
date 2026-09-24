'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Lead, LeadInput, LeadStatus } from '@/lib/leadflow';

type Props = {
  initialLeads: Lead[];
  demoMode: boolean;
};

const emptyForm: LeadInput = {
  name: '',
  email: '',
  business_type: '',
  need: '',
  budget: 'Not sure',
  urgency: 'Just exploring',
};

const statusLabels: Record<LeadStatus, string> = {
  processing: 'Processing',
  qualified: 'Qualified',
  review: 'Needs review',
  nurture: 'Nurture',
  archived: 'Archived',
};

function SparkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75 14.1 9.9 21.25 12l-7.15 2.1L12 21.25l-2.1-7.15L2.75 12 9.9 9.9 12 2.75Z" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>;
}

export default function LeadFlow({ initialLeads, demoMode }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState(initialLeads[0]?.id ?? null);
  const [form, setForm] = useState<LeadInput>(emptyForm);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode || !leads.some((lead) => lead.status === 'processing')) return;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/leads', { cache: 'no-store' });
        if (!response.ok) return;
        setLeads(await response.json());
      } catch {
        // A later poll retries transient failures.
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [demoMode, leads]);

  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0] ?? null;
  const visibleLeads = filter === 'all' ? leads : leads.filter((lead) => lead.status === filter);
  const metrics = useMemo(() => ({
    total: leads.length,
    qualified: leads.filter((lead) => lead.status === 'qualified').length,
    review: leads.filter((lead) => lead.status === 'review').length,
    average: leads.filter((lead) => lead.score !== null).length
      ? Math.round(leads.reduce((sum, lead) => sum + (lead.score ?? 0), 0) / leads.filter((lead) => lead.score !== null).length)
      : 0,
  }), [leads]);

  function updateField<K extends keyof LeadInput>(field: K, value: LeadInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Could not process the request.');

      const lead = payload.lead as Lead;
      setLeads((current) => [lead, ...current]);
      setSelectedId(lead.id);
      setForm(emptyForm);
      setNotice(payload.mode === 'demo'
        ? 'Demo analysis completed locally. No email was sent.'
        : 'Request received. n8n is processing the workflow.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not process the request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="workspace-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="product-header">
        <a className="brand" href="#top" aria-label="LeadFlow AI home">
          <span className="brand-mark"><SparkIcon /></span>
          <span>LeadFlow AI</span>
        </a>
        <div className={`live-pill ${demoMode ? 'inactive' : ''}`}>
          <span /> {demoMode ? 'Safe demo mode' : 'n8n workflow connected'}
        </div>
      </header>

      <section className="lead-hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><SparkIcon /> Intelligent lead operations</div>
          <h1>From new inquiry to<br /><span>the right next action.</span></h1>
          <p>
            LeadFlow captures business requests, removes duplicates, asks AI for structured analysis
            and lets n8n route every opportunity through the right workflow.
          </p>
          <div className="workflow-strip" aria-label="Automation workflow">
            <span>Capture</span><ArrowIcon /><span>Validate</span><ArrowIcon /><span>Analyze</span><ArrowIcon /><span>Route</span>
          </div>
        </div>

        <form className="lead-form" onSubmit={submitLead}>
          <div className="form-heading">
            <div><p className="section-label">Live workflow input</p><h2>Submit a test request</h2></div>
            <span>Nothing is sent without approval</span>
          </div>
          <div className="form-grid">
            <label>Name<input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Alex Morgan" required minLength={2} maxLength={80} /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="alex@company.com" required maxLength={160} /></label>
            <label className="full">Business type<input value={form.business_type} onChange={(event) => updateField('business_type', event.target.value)} placeholder="E-commerce, consulting, local services…" required maxLength={100} /></label>
            <label>Budget<select value={form.budget} onChange={(event) => updateField('budget', event.target.value)}><option>Under $500</option><option>$500 – $1,000</option><option>$1,000 – $2,500</option><option>$2,500+</option><option>Not sure</option></select></label>
            <label>Urgency<select value={form.urgency} onChange={(event) => updateField('urgency', event.target.value)}><option>Today</option><option>This week</option><option>This month</option><option>Just exploring</option></select></label>
            <label className="full">What needs to improve?<textarea value={form.need} onChange={(event) => updateField('need', event.target.value)} placeholder="Describe the current process, bottleneck and expected result…" required minLength={20} maxLength={1200} rows={4} /></label>
          </div>
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            <SparkIcon /> {isSubmitting ? 'Running workflow…' : 'Run qualification workflow'}
          </button>
          {notice && <p className="form-notice" role="status">{notice}</p>}
        </form>
      </section>

      <section className="operations-section">
        <div className="operations-heading">
          <div><p className="section-label">Operations dashboard</p><h2>Every opportunity, explained</h2></div>
          <p>AI proposes. Business rules decide. A human approves the communication.</p>
        </div>

        <div className="metric-cards">
          <div><span>Requests</span><strong>{metrics.total}</strong><small>Captured by the workflow</small></div>
          <div><span>Qualified</span><strong>{metrics.qualified}</strong><small>Ready for personal follow-up</small></div>
          <div><span>Needs review</span><strong>{metrics.review}</strong><small>Waiting for human context</small></div>
          <div><span>Average score</span><strong>{metrics.average}</strong><small>Across analyzed requests</small></div>
        </div>

        <div className="lead-workspace">
          <div className="lead-queue">
            <div className="queue-toolbar">
              <div><p className="section-label">Qualification queue</p><h3>Recent requests</h3></div>
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter leads">
                <option value="all">All statuses</option><option value="qualified">Qualified</option><option value="review">Needs review</option><option value="nurture">Nurture</option><option value="processing">Processing</option>
              </select>
            </div>
            <div className="lead-list">
              {visibleLeads.map((lead) => (
                <button key={lead.id} className={`lead-row ${selected?.id === lead.id ? 'selected' : ''}`} onClick={() => setSelectedId(lead.id)}>
                  <span className="lead-avatar">{lead.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                  <span className="lead-primary"><strong>{lead.name}</strong><small>{lead.business_type}</small></span>
                  <span className={`status-badge ${lead.status}`}>{statusLabels[lead.status]}</span>
                  <span className="score-cell">{lead.score ?? '—'}<small>/100</small></span>
                  <ArrowIcon />
                </button>
              ))}
              {!visibleLeads.length && <div className="queue-empty">No requests match this status.</div>}
            </div>
          </div>

          <aside className="lead-detail">
            {selected ? (
              <>
                <div className="detail-topline">
                  <span className={`status-badge ${selected.status}`}>{statusLabels[selected.status]}</span>
                  <time dateTime={selected.created_at}>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(selected.created_at))}</time>
                </div>
                <h3>{selected.name}</h3>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
                <div className="score-block">
                  <div><span>Qualification score</span><strong>{selected.score ?? '—'}<small>/100</small></strong></div>
                  <div className="score-bar"><span style={{ width: `${selected.score ?? 0}%` }} /></div>
                </div>
                <div className="analysis-block"><span>AI summary</span><p>{selected.summary || 'The workflow is analyzing this request.'}</p></div>
                <div className="detail-pair"><div><span>Category</span><strong>{selected.category || 'Pending'}</strong></div><div><span>Recommended service</span><strong>{selected.recommended_service || 'Pending'}</strong></div></div>
                <div className="analysis-block"><span>Why this score</span><ul>{selected.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
                <div className="analysis-block next-action"><span>Next action</span><p>{selected.next_action || 'Wait for workflow completion.'}</p></div>
                {selected.draft_reply && <div className="draft-box"><div><span>Draft reply</span><em>Human approval required</em></div><p>{selected.draft_reply}</p><button type="button" disabled>Approve & send — demo only</button></div>}
              </>
            ) : <div className="queue-empty">Select a request to inspect the automation result.</div>}
          </aside>
        </div>
      </section>

      <section className="automation-proof">
        <div><p className="section-label">Why automation matters</p><h2>More than an AI prompt</h2></div>
        <div className="proof-grid">
          <article><span>01</span><h3>Reliable triggers</h3><p>The workflow starts from a real business event, without somebody copying information into a chat.</p></article>
          <article><span>02</span><h3>Rules and routing</h3><p>Deterministic checks handle duplicates, budgets and priority before AI assists with interpretation.</p></article>
          <article><span>03</span><h3>Human control</h3><p>Messages remain drafts until a person approves them, while every decision stays visible and auditable.</p></article>
        </div>
      </section>

      <footer><span>LeadFlow AI</span><p>Next.js · Supabase · n8n · AI analysis</p></footer>
    </main>
  );
}
