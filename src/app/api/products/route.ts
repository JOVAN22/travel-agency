import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePagination, sanitizeSearch } from '@/lib/utils';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface ProductsResponse {
  data: Record<string, unknown>[];
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
  const type = sanitizeSearch(searchParams.get('type'));
  const destination = sanitizeSearch(searchParams.get('destination'));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('name');

  if (type) {
    query = query.eq('type', type);
  }

  if (destination) {
    query = query.ilike('name', `%${destination}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  const response: ProductsResponse = {
    data: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  };

  return NextResponse.json(response);
}
