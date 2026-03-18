import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', id)
    .single();

  if (agencyError) {
    const status = agencyError.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: agencyError.message }, { status });
  }

  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('agency_id', id)
    .order('last_name');

  if (agentsError) {
    return NextResponse.json({ error: agentsError.message }, { status: 500 });
  }

  return NextResponse.json({ ...agency, agents });
}
