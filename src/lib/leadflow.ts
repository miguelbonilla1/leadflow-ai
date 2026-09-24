export type LeadStatus = 'processing' | 'qualified' | 'review' | 'nurture' | 'archived';

export type Lead = {
  id: string;
  name: string;
  email: string;
  business_type: string;
  need: string;
  budget: string;
  urgency: string;
  status: LeadStatus;
  score: number | null;
  category: string | null;
  summary: string | null;
  recommended_service: string | null;
  next_action: string | null;
  draft_reply: string | null;
  reasons: string[];
  created_at: string;
  updated_at: string;
};

export type LeadInput = Pick<
  Lead,
  'name' | 'email' | 'business_type' | 'need' | 'budget' | 'urgency'
>;

export const demoLeads: Lead[] = [
  {
    id: 'demo-aurora',
    name: 'Sofia Mendes',
    email: 'sofia@example.com',
    business_type: 'E-commerce',
    need: 'We lose customer questions after business hours and need a better support workflow.',
    budget: '$1,000 – $2,500',
    urgency: 'This month',
    status: 'qualified',
    score: 88,
    category: 'Customer operations',
    summary: 'E-commerce team looking to reduce missed support requests outside business hours.',
    recommended_service: 'AI-assisted support triage',
    next_action: 'Schedule a discovery call and map the current support channels.',
    draft_reply: 'Hi Sofia, your support workflow looks like a strong automation opportunity. I would like to map the channels you currently use and identify where requests are being lost.',
    reasons: ['Clear operational pain', 'Budget aligns with scope', 'Defined implementation window'],
    created_at: '2026-09-24T12:30:00.000Z',
    updated_at: '2026-09-24T12:32:00.000Z',
  },
  {
    id: 'demo-northstar',
    name: 'Daniel Costa',
    email: 'daniel@example.com',
    business_type: 'Consulting',
    need: 'Qualify inbound requests and organize follow-ups for our small sales team.',
    budget: '$500 – $1,000',
    urgency: 'This week',
    status: 'review',
    score: 71,
    category: 'Lead operations',
    summary: 'Small consulting team needs consistent qualification and follow-up for inbound leads.',
    recommended_service: 'Lead qualification workflow',
    next_action: 'Review expected lead volume before defining the workflow.',
    draft_reply: 'Hi Daniel, I can help structure the qualification and follow-up process. The next useful step is confirming your monthly lead volume and the tools your team already uses.',
    reasons: ['Urgent request', 'Business goal is clear', 'Volume is not yet defined'],
    created_at: '2026-09-24T10:05:00.000Z',
    updated_at: '2026-09-24T10:07:00.000Z',
  },
  {
    id: 'demo-verde',
    name: 'Mariana Silva',
    email: 'mariana@example.com',
    business_type: 'Local services',
    need: 'Exploring ways to save time answering repeated questions.',
    budget: 'Not sure',
    urgency: 'Just exploring',
    status: 'nurture',
    score: 46,
    category: 'Customer operations',
    summary: 'Early-stage request to reduce repetitive customer questions.',
    recommended_service: 'Automation discovery session',
    next_action: 'Send educational material and follow up in seven days.',
    draft_reply: 'Hi Mariana, there are several lightweight ways to reduce repetitive questions. I can share a short discovery checklist to help identify which option fits your workflow.',
    reasons: ['Relevant use case', 'Budget is undefined', 'No immediate timeline'],
    created_at: '2026-09-23T16:20:00.000Z',
    updated_at: '2026-09-23T16:23:00.000Z',
  },
];

const budgetScore: Record<string, number> = {
  'Under $500': 5,
  '$500 – $1,000': 14,
  '$1,000 – $2,500': 24,
  '$2,500+': 30,
  'Not sure': 8,
};

const urgencyScore: Record<string, number> = {
  Today: 25,
  'This week': 21,
  'This month': 16,
  'Just exploring': 5,
};

export function classifyDemoLead(input: LeadInput): Lead {
  const detailScore = Math.min(30, Math.round(input.need.trim().length / 8));
  const score = Math.min(100, 15 + (budgetScore[input.budget] ?? 5) + (urgencyScore[input.urgency] ?? 5) + detailScore);
  const status: LeadStatus = score >= 78 ? 'qualified' : score >= 58 ? 'review' : 'nurture';
  const lowerNeed = input.need.toLowerCase();
  const category = lowerNeed.includes('lead') || lowerNeed.includes('sales')
    ? 'Lead operations'
    : lowerNeed.includes('support') || lowerNeed.includes('customer') || lowerNeed.includes('whatsapp')
      ? 'Customer operations'
      : 'Workflow automation';

  const recommendedService = category === 'Lead operations'
    ? 'Lead qualification workflow'
    : category === 'Customer operations'
      ? 'AI-assisted support triage'
      : 'Automation discovery and workflow design';

  const now = new Date().toISOString();
  return {
    id: `demo-${Date.now()}`,
    ...input,
    status,
    score,
    category,
    summary: `${input.business_type} request focused on ${input.need.trim().replace(/[.!?]+$/, '').toLowerCase()}.`,
    recommended_service: recommendedService,
    next_action: status === 'qualified'
      ? 'Review the AI draft and schedule a discovery call.'
      : status === 'review'
        ? 'Review the missing context before contacting the lead.'
        : 'Add the lead to a low-frequency follow-up sequence.',
    draft_reply: `Hi ${input.name.split(' ')[0]}, thanks for sharing what you want to improve. I reviewed your request and ${recommendedService.toLowerCase()} looks like a useful starting point. I would like to understand your current process before recommending the final scope.`,
    reasons: [
      input.need.length > 80 ? 'Detailed business problem' : 'Request needs more operational detail',
      input.budget === 'Not sure' ? 'Budget is not defined' : 'Budget range was provided',
      input.urgency === 'Just exploring' ? 'No immediate timeline' : `Requested timeline: ${input.urgency.toLowerCase()}`,
    ],
    created_at: now,
    updated_at: now,
  };
}
