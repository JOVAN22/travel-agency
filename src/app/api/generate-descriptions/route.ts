import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CommissionRule {
  season: string;
  base_commission_pct: number;
  bonus_commission_pct: number;
  max_days_for_bonus: number;
}

interface Product {
  id: string;
  name: string;
  type: string;
  destination?: string;
  price?: number;
  description?: string | null;
}

const SEASON_LABELS: Record<string, string> = {
  peak_summer: 'Peak Summer',
  peak_holiday: 'Peak Holiday',
  shoulder: 'Shoulder',
  post_school_off_peak: 'Post-School Off-Peak',
  winter_off_peak: 'Winter Off-Peak',
};

function buildDescription(product: Product, rules: CommissionRule[]): string {
  const parts: string[] = [];

  parts.push(product.name);

  if (product.type) parts.push(`Type: ${product.type}`);
  if (product.destination) parts.push(`Destination: ${product.destination}`);
  if (product.price != null) parts.push(`Price: $${product.price}`);

  for (const rule of rules) {
    const seasonLabel = SEASON_LABELS[rule.season] ?? rule.season;
    const bonusPart = rule.bonus_commission_pct > 0
      ? ` + ${rule.bonus_commission_pct}% bonus (sell within ${rule.max_days_for_bonus} days)`
      : '';
    parts.push(`${seasonLabel}: ${rule.base_commission_pct}% base${bonusPart}`);
  }

  // Highlight best bonus opportunity
  const bestBonus = rules.reduce<CommissionRule | null>((best, r) => {
    if (!best || r.bonus_commission_pct > best.bonus_commission_pct) return r;
    return best;
  }, null);

  if (bestBonus && bestBonus.bonus_commission_pct > 0) {
    parts.push(
      `Best bonus: sell within ${bestBonus.max_days_for_bonus} days for +${bestBonus.bonus_commission_pct}% speed bonus`
    );
  }

  return parts.join(' | ');
}

export async function POST() {
  // Fetch all products (description may or may not be null)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, type, destination, price, description');

  if (productsError) {
    if (productsError.message.includes('description')) {
      return NextResponse.json(
        {
          error: 'The description column does not exist yet.',
          message: 'Please click "Check Setup" first and run the SQL in your Supabase SQL Editor.',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to fetch products', detail: productsError.message }, { status: 500 });
  }

  if (!products || products.length === 0) {
    return NextResponse.json({ updated: 0, message: 'No products found.' });
  }

  // Fetch all commission rules in one query
  const { data: allRules, error: rulesError } = await supabase
    .from('commission_rules')
    .select('product_id, season, base_commission_pct, bonus_commission_pct, max_days_for_bonus');

  if (rulesError) {
    return NextResponse.json({ error: 'Failed to fetch commission rules', detail: rulesError.message }, { status: 500 });
  }

  // Group rules by product_id
  const rulesByProduct = new Map<string, CommissionRule[]>();
  for (const rule of (allRules ?? [])) {
    const existing = rulesByProduct.get(rule.product_id) ?? [];
    existing.push({
      season: rule.season,
      base_commission_pct: rule.base_commission_pct,
      bonus_commission_pct: rule.bonus_commission_pct,
      max_days_for_bonus: rule.max_days_for_bonus,
    });
    rulesByProduct.set(rule.product_id, existing);
  }

  let updated = 0;
  const errors: string[] = [];

  for (const product of products as Product[]) {
    const rules = rulesByProduct.get(product.id) ?? [];
    const description = buildDescription(product, rules);

    const { error: updateError } = await supabase
      .from('products')
      .update({ description })
      .eq('id', product.id);

    if (updateError) {
      errors.push(`${product.id}: ${updateError.message}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    updated,
    total: products.length,
    errors: errors.length > 0 ? errors : undefined,
    message: `Successfully generated descriptions for ${updated} of ${products.length} products.`,
  });
}
