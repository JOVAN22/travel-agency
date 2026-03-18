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
  for (const table of ['agencies', 'agents', 'products', 'commission_rules', 'sales']) {
    const { data, error } = await sb.from(table).select('*').limit(1);
    if (error) {
      console.log(`${table}: ERROR - ${error.message}`);
    } else {
      console.log(`${table}: columns = [${Object.keys(data?.[0] ?? {}).join(', ')}]`);
    }
  }
}
main();
