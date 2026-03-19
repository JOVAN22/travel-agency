import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidUUID } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (productError) {
    const status = productError.code === 'PGRST116' ? 404 : 500;
    const message = status === 404 ? 'Product not found' : 'Failed to fetch product';
    return NextResponse.json({ error: message }, { status });
  }

  const { data: commissionRules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('product_id', id)
    .order('season');

  if (rulesError) {
    return NextResponse.json({ error: 'Failed to fetch commission rules' }, { status: 500 });
  }

  return NextResponse.json({ ...product, commission_rules: commissionRules });
}
