import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';

  if (!q.trim()) {
    return NextResponse.json({ agencies: [], agents: [] });
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
    return NextResponse.json({ error: agenciesResult.error.message }, { status: 500 });
  }
  if (agentsResult.error) {
    return NextResponse.json({ error: agentsResult.error.message }, { status: 500 });
  }

  const agents = agentsResult.data.map(({ agencies, ...agent }) => ({
    ...agent,
    agency_name: (agencies as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({
    agencies: agenciesResult.data,
    agents,
  });
}
