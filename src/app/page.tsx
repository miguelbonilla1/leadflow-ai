import LeadFlow from '@/components/LeadFlow';
import { demoLeads, Lead } from '@/lib/leadflow';
import { getSupabaseAdmin, isDemoMode } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

async function getLeads(): Promise<{ leads: Lead[]; demoMode: boolean }> {
  if (isDemoMode()) return { leads: demoLeads, demoMode: true };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { leads: demoLeads, demoMode: true };

  try {
    const query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database request timed out')), 4000),
    );
    const { data, error } = await Promise.race([query, timeout]);
    if (error) return { leads: demoLeads, demoMode: true };
    return { leads: data as Lead[], demoMode: false };
  } catch {
    return { leads: demoLeads, demoMode: true };
  }
}

export default async function Home() {
  const { leads, demoMode } = await getLeads();
  return <LeadFlow initialLeads={leads} demoMode={demoMode} />;
}
