import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidUUID } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid agency ID' }, { status: 400 });
  }

  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', id)
    .single();

  if (agencyError) {
    const status = agencyError.code === 'PGRST116' ? 404 : 500;
    const message = status === 404 ? 'Agency not found' : 'Failed to fetch agency';
    return NextResponse.json({ error: message }, { status });
  }

  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('agency_id', id)
    .order('last_name');

  if (agentsError) {
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }

  return NextResponse.json({ ...agency, agents });
}
