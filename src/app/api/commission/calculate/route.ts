import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Season =
  | 'post_school_off_peak'
  | 'winter_off_peak'
  | 'peak_summer'
  | 'peak_holiday'
  | 'shoulder';

function getSeason(departureDateStr: string): Season {
  const month = new Date(departureDateStr).getUTCMonth() + 1;
  if (month === 9 || month === 10) return 'post_school_off_peak';
  if (month === 1 || month === 2) return 'winter_off_peak';
  if (month >= 6 && month <= 8) return 'peak_summer';
  if (month === 12) return 'peak_holiday';
  return 'shoulder';
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  let body: {
    product_id: string;
    sale_date: string;
    departure_date: string;
    product_listed_date: string;
    sale_price?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { product_id, sale_date, departure_date, product_listed_date, sale_price } = body;

  if (!product_id || !sale_date || !departure_date || !product_listed_date) {
    return NextResponse.json(
      { error: 'Missing required fields: product_id, sale_date, departure_date, product_listed_date' },
      { status: 400 }
    );
  }

  const season = getSeason(departure_date);
  const days_to_sell = daysBetween(sale_date, product_listed_date);

  const { data: rules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('product_id', product_id)
    .eq('season', season);

  if (rulesError) {
    return NextResponse.json({ error: rulesError.message }, { status: 500 });
  }

  if (!rules || rules.length === 0) {
    return NextResponse.json(
      { error: `No commission rule found for product ${product_id} in season ${season}` },
      { status: 404 }
    );
  }

  const rule = rules[0];
  const base_commission_pct: number = rule.base_commission_pct;
  const bonus_commission_pct: number =
    days_to_sell <= rule.max_days_for_bonus ? rule.bonus_commission_pct : 0;
  const total_commission_pct = base_commission_pct + bonus_commission_pct;

  const effectiveSalePrice = sale_price ?? null;
  const commission_amount =
    effectiveSalePrice != null
      ? parseFloat(((effectiveSalePrice * total_commission_pct) / 100).toFixed(2))
      : null;

  return NextResponse.json({
    season,
    days_to_sell,
    base_commission_pct,
    bonus_commission_pct,
    total_commission_pct,
    sale_price: effectiveSalePrice,
    commission_amount,
  });
}
