import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePagination, sanitizeSearch } from '@/lib/utils';

interface AgentRecord {
  agency_name: string | null;
  [key: string]: unknown;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface AgentsResponse {
  data: AgentRecord[];
  pagination: PaginationMeta;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );

  if (!pagination) {
    return NextResponse.json(
      { error: 'page must be a positive integer; limit must be between 1 and 100' },
      { status: 400 }
    );
  }

  const { page, limit } = pagination;
  // Strip chars that break PostgREST .or() filter syntax (commas, parens)
  const search = sanitizeSearch(searchParams.get('search')).replace(/[(),]/g, '');
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
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }

  const agents: AgentRecord[] = (data ?? []).map(({ agencies, ...agent }) => ({
    ...agent,
    agency_name: (agencies as { name: string } | null)?.name ?? null,
  }));

  const response: AgentsResponse = {
    data: agents,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  };

  return NextResponse.json(response);
}
