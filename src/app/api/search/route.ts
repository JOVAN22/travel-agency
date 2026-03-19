import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeSearch } from '@/lib/utils';

interface AgencyResult {
  [key: string]: unknown;
}

interface AgentResult {
  agency_name: string | null;
  [key: string]: unknown;
}

interface SearchResponse {
  agencies: AgencyResult[];
  agents: AgentResult[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Strip chars that break PostgREST .or() filter syntax (commas, parens)
  const q = sanitizeSearch(searchParams.get('q')).replace(/[(),]/g, '');

  if (!q) {
    return NextResponse.json<SearchResponse>(
      { agencies: [], agents: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const pattern = `%${q}%`;

  const [agenciesResult, agentsResult] = await Promise.all([
    supabase
      .from('agencies')
      .select('*')
      .ilike('name', pattern)
      .limit(20)
      .order('name'),

    supabase
      .from('agents')
      .select('*, agencies(name)')
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
      .limit(20)
      .order('last_name'),
  ]);

  if (agenciesResult.error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
  if (agentsResult.error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  const agents: AgentResult[] = (agentsResult.data ?? []).map(({ agencies, ...agent }) => ({
    ...agent,
    agency_name: (agencies as { name: string } | null)?.name ?? null,
  }));

  const response: SearchResponse = {
    agencies: agenciesResult.data ?? [],
    agents,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
