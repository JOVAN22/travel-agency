import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const content = fs.readFileSync('.env.local', 'utf-8').replace(/^\uFEFF/, '').replace(/\r/g, '');
const env: Record<string, string> = {};
for (const line of content.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function main() {
  // Probe products with a variety of possible column names
  const { error: e1 } = await sb.from('products').insert({
    type: 'airline', name: 'Test', base_price: 100,
    departure_start: '2025-01-01', departure_end: '2025-01-10',
  });
  console.log('products base_price:', e1?.message ?? 'OK');

  const { error: e2 } = await sb.from('products').insert({
    type: 'airline', name: 'Test', price: 100,
    departure_start: '2025-01-01', departure_end: '2025-01-10',
  });
  console.log('products price:', e2?.message ?? 'OK');

  // Probe commission_rules
  const { error: e3 } = await sb.from('commission_rules').insert({
    product_id: '00000000-0000-0000-0000-000000000000',
    season: 'peak_summer',
    base_commission_pct: 10, bonus_commission_pct: 2,
    max_days_for_bonus: 5,
    valid_from: '2025-01-01', valid_to: '2025-12-31',
  });
  console.log('commission_rules (snake_pct):', e3?.message ?? 'OK');

  // Probe sales
  const { error: e4 } = await sb.from('sales').insert({
    agent_id: '00000000-0000-0000-0000-000000000000',
    product_id: '00000000-0000-0000-0000-000000000000',
    sale_date: '2025-01-01',
    product_listed_date: '2025-01-01',
    departure_date: '2025-03-01',
    sale_price: 100,
    final_commission_pct: 10,
    commission_amount: 10,
  });
  console.log('sales:', e4?.message ?? 'OK');
}
main();
