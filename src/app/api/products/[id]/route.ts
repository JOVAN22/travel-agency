import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (productError) {
    const status = productError.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: productError.message }, { status });
  }

  const { data: commissionRules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('product_id', id)
    .order('season');

  if (rulesError) {
    return NextResponse.json({ error: rulesError.message }, { status: 500 });
  }

  return NextResponse.json({ ...product, commission_rules: commissionRules });
}
