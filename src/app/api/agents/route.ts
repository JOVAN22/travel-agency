import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const search = searchParams.get('search') ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('agents')
    .select('*, agencies(name)', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('last_name');

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const agents = data.map(({ agencies, ...agent }) => ({
    ...agent,
    agency_name: (agencies as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({
    data: agents,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}
