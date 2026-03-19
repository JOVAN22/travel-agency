import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`Could not find .env.local at: ${envPath}`);
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf-8')
  .replace(/^\uFEFF/, '') // strip BOM
  .replace(/\r/g, '');    // strip carriage returns
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH_SIZE = 500;

const CITIES: { city: string; country: string }[] = [
  { city: 'New York', country: 'USA' },
  { city: 'Los Angeles', country: 'USA' },
  { city: 'Chicago', country: 'USA' },
  { city: 'Miami', country: 'USA' },
  { city: 'Las Vegas', country: 'USA' },
  { city: 'London', country: 'UK' },
  { city: 'Manchester', country: 'UK' },
  { city: 'Edinburgh', country: 'UK' },
  { city: 'Paris', country: 'France' },
  { city: 'Lyon', country: 'France' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Munich', country: 'Germany' },
  { city: 'Frankfurt', country: 'Germany' },
  { city: 'Madrid', country: 'Spain' },
  { city: 'Barcelona', country: 'Spain' },
  { city: 'Rome', country: 'Italy' },
  { city: 'Milan', country: 'Italy' },
  { city: 'Amsterdam', country: 'Netherlands' },
  { city: 'Brussels', country: 'Belgium' },
  { city: 'Zurich', country: 'Switzerland' },
  { city: 'Vienna', country: 'Austria' },
  { city: 'Stockholm', country: 'Sweden' },
  { city: 'Oslo', country: 'Norway' },
  { city: 'Copenhagen', country: 'Denmark' },
  { city: 'Helsinki', country: 'Finland' },
  { city: 'Warsaw', country: 'Poland' },
  { city: 'Prague', country: 'Czech Republic' },
  { city: 'Budapest', country: 'Hungary' },
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Athens', country: 'Greece' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Abu Dhabi', country: 'UAE' },
  { city: 'Riyadh', country: 'Saudi Arabia' },
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Tel Aviv', country: 'Israel' },
  { city: 'Mumbai', country: 'India' },
  { city: 'Delhi', country: 'India' },
  { city: 'Bangalore', country: 'India' },
  { city: 'Singapore', country: 'Singapore' },
  { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Bangkok', country: 'Thailand' },
  { city: 'Hong Kong', country: 'Hong Kong' },
  { city: 'Shanghai', country: 'China' },
  { city: 'Beijing', country: 'China' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'Osaka', country: 'Japan' },
  { city: 'Seoul', country: 'South Korea' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Melbourne', country: 'Australia' },
  { city: 'São Paulo', country: 'Brazil' },
  { city: 'Buenos Aires', country: 'Argentina' },
  { city: 'Mexico City', country: 'Mexico' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Vancouver', country: 'Canada' },
  { city: 'Cape Town', country: 'South Africa' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Cairo', country: 'Egypt' },
];

const AGENCY_SUFFIXES = ['Travel', 'Tours', 'Holidays', 'Adventures'];
const AGENT_ROLES = ['Senior Agent', 'Junior Agent', 'Team Lead', 'Sales Manager'];

const PRODUCT_TYPES = ['airline', 'hotel', 'cruise', 'car_rental', 'package'] as const;
type ProductType = typeof PRODUCT_TYPES[number];

const SEASONS = [
  'post_school_off_peak',
  'winter_off_peak',
  'shoulder',
  'peak_summer',
  'peak_holiday',
] as const;
type Season = typeof SEASONS[number];

interface SeasonConfig {
  baseMin: number;
  baseMax: number;
  bonusMin: number;
  bonusMax: number;
  maxDaysForBonus: number;
  validFrom: string;
  validTo: string;
}

const SEASON_CONFIGS: Record<Season, SeasonConfig> = {
  post_school_off_peak: {
    baseMin: 12, baseMax: 18, bonusMin: 3, bonusMax: 5, maxDaysForBonus: 5,
    validFrom: '2025-01-28', validTo: '2025-03-31',
  },
  winter_off_peak: {
    baseMin: 10, baseMax: 15, bonusMin: 2, bonusMax: 4, maxDaysForBonus: 5,
    validFrom: '2025-01-01', validTo: '2025-01-27',
  },
  shoulder: {
    baseMin: 8, baseMax: 12, bonusMin: 1, bonusMax: 3, maxDaysForBonus: 7,
    validFrom: '2025-04-01', validTo: '2025-06-14',
  },
  peak_summer: {
    baseMin: 5, baseMax: 8, bonusMin: 1, bonusMax: 2, maxDaysForBonus: 5,
    validFrom: '2025-06-15', validTo: '2025-08-31',
  },
  peak_holiday: {
    baseMin: 5, baseMax: 8, bonusMin: 1, bonusMax: 2, maxDaysForBonus: 5,
    validFrom: '2025-12-01', validTo: '2025-12-31',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

async function batchInsert<T extends object>(
  table: string,
  rows: T[],
  label: string,
): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from(table).insert(batch).select('id');
    if (error) {
      console.error(`Error inserting into ${table} at offset ${i}:`, error.message);
      process.exit(1);
    }
    if (data) ids.push(...data.map((r: any) => r.id));
    const pct = Math.min(100, Math.round(((i + batch.length) / rows.length) * 100));
    process.stdout.write(`\r  ${label}: ${i + batch.length}/${rows.length} (${pct}%)`);
  }
  console.log(); // newline after progress
  return ids;
}

function getProductPriceRange(type: ProductType): [number, number] {
  switch (type) {
    case 'airline':    return [200, 2000];
    case 'hotel':      return [100, 800];
    case 'cruise':     return [1000, 8000];
    case 'car_rental': return [50, 300];
    case 'package':    return [500, 5000];
  }
}

function getProductName(type: ProductType): string {
  const dest = faker.helpers.arrayElement(CITIES).city;
  switch (type) {
    case 'airline':    return `Flight to ${dest}`;
    case 'hotel':      return `${faker.helpers.arrayElement(['Luxury', 'Boutique', 'Budget', 'Business', 'Resort'])} Hotel in ${dest}`;
    case 'cruise':     return faker.helpers.arrayElement([
      'Caribbean Cruise', 'Mediterranean Cruise', 'Alaska Cruise',
      'Norwegian Fjords Cruise', 'Baltic Sea Cruise', 'Nile River Cruise',
    ]);
    case 'car_rental': return `Car Rental in ${dest}`;
    case 'package':    return `${dest} Vacation Package`;
  }
}

function getSeasonForDate(date: Date): Season | null {
  const str = toDateStr(date);
  for (const [season, cfg] of Object.entries(SEASON_CONFIGS) as [Season, SeasonConfig][]) {
    if (str >= cfg.validFrom && str <= cfg.validTo) return season;
  }
  // Handle autumn shoulder (Sep-Nov) — map to shoulder config
  const month = date.getMonth() + 1;
  if (month >= 9 && month <= 11) return 'shoulder';
  return null;
}

// ─── Generators ───────────────────────────────────────────────────────────────

function generateAgencies(count: number) {
  return Array.from({ length: count }, () => {
    const location = faker.helpers.arrayElement(CITIES);
    const suffix = faker.helpers.arrayElement(AGENCY_SUFFIXES);
    return {
      name: `${faker.company.name()} ${suffix}`,
      city: location.city,
      country: location.country,
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
    };
  });
}

function generateAgents(count: number, agencyIds: string[]) {
  return Array.from({ length: count }, () => {
    const role = faker.helpers.weightedArrayElement([
      { weight: 40, value: 'Junior Agent' },
      { weight: 35, value: 'Senior Agent' },
      { weight: 15, value: 'Team Lead' },
      { weight: 10, value: 'Sales Manager' },
    ]);
    const status = Math.random() < 0.85 ? 'active' : 'inactive';
    return {
      agency_id: faker.helpers.arrayElement(agencyIds),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      role,
      status,
    };
  });
}

function generateProducts(count: number) {
  const now = new Date();
  const in12Months = addDays(now, 365);
  return Array.from({ length: count }, () => {
    const type = faker.helpers.arrayElement(PRODUCT_TYPES);
    const [priceMin, priceMax] = getProductPriceRange(type);
    const departureStart = faker.date.between({ from: now, to: in12Months });
    const departureEnd = addDays(departureStart, randInt(3, 14));
    return {
      type,
      name: getProductName(type),
      base_price: parseFloat(randomBetween(priceMin, priceMax).toFixed(2)),
      departure_start: toDateStr(departureStart),
      departure_end: toDateStr(departureEnd),
    };
  });
}

function generateCommissionRules(productIds: string[]) {
  const rules = [];
  for (const product_id of productIds) {
    for (const season of SEASONS) {
      const cfg = SEASON_CONFIGS[season];
      rules.push({
        product_id,
        season,
        base_commission_pct: parseFloat(randomBetween(cfg.baseMin, cfg.baseMax).toFixed(2)),
        bonus_commission_pct: parseFloat(randomBetween(cfg.bonusMin, cfg.bonusMax).toFixed(2)),
        max_days_for_bonus: cfg.maxDaysForBonus,
        valid_from: cfg.validFrom,
        valid_to: cfg.validTo,
      });
    }
  }
  return rules;
}

interface CommissionRule {
  id: string;
  product_id: string;
  season: Season;
  base_commission_pct: number;
  bonus_commission_pct: number;
  max_days_for_bonus: number;
}

function generateSales(
  count: number,
  agentIds: string[],
  productIds: string[],
  rules: CommissionRule[],
) {
  // Build lookup: product_id -> season -> rule
  const ruleMap = new Map<string, Map<Season, CommissionRule>>();
  for (const rule of rules) {
    if (!ruleMap.has(rule.product_id)) ruleMap.set(rule.product_id, new Map());
    ruleMap.get(rule.product_id)!.set(rule.season, rule);
  }

  const now = new Date();
  const oneYearAgo = subDays(now, 365);

  return Array.from({ length: count }, () => {
    const product_id = faker.helpers.arrayElement(productIds);
    const agent_id = faker.helpers.arrayElement(agentIds);

    const saleDate = faker.date.between({ from: oneYearAgo, to: now });
    const listedDaysBack = randInt(1, 30);
    const productListedDate = subDays(saleDate, listedDaysBack);
    const daysToSell = listedDaysBack;
    const departureDate = addDays(saleDate, randInt(30, 180));

    const season = getSeasonForDate(departureDate);
    const productRules = ruleMap.get(product_id);
    let finalCommissionPct = 8; // fallback
    if (season && productRules?.has(season)) {
      const rule = productRules.get(season)!;
      const eligible = daysToSell <= rule.max_days_for_bonus;
      finalCommissionPct = eligible
        ? rule.base_commission_pct + rule.bonus_commission_pct
        : rule.base_commission_pct;
    }

    // Use product type price range for sale_price
    const salePrice = parseFloat(randomBetween(50, 8000).toFixed(2));
    const commissionAmount = parseFloat((salePrice * finalCommissionPct / 100).toFixed(2));

    return {
      agent_id,
      product_id,
      sale_date: toDateStr(saleDate),
      product_listed_date: toDateStr(productListedDate),
      departure_date: toDateStr(departureDate),
      sale_price: salePrice,
      final_commission_pct: parseFloat(finalCommissionPct.toFixed(2)),
      commission_amount: commissionAmount,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function truncateAll() {
  // Delete in reverse FK order
  const tables = ['sales', 'commission_rules', 'products', 'agents', 'agencies'];
  for (const table of tables) {
    process.stdout.write(`  Clearing ${table}...`);
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) {
      console.error(`\nFailed to clear ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(' done');
  }
}

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('0/5 Clearing existing data...');
  await truncateAll();

  // 1. Agencies
  console.log('1/5 Generating 500 agencies...');
  const agencyRows = generateAgencies(500);
  const agencyIds = await batchInsert('agencies', agencyRows, 'Agencies');
  console.log(`   ✓ ${agencyIds.length} agencies inserted`);

  // 2. Agents
  console.log('\n2/5 Generating 20,000 agents...');
  const agentRows = generateAgents(20000, agencyIds);
  const agentIds = await batchInsert('agents', agentRows, 'Agents');
  console.log(`   ✓ ${agentIds.length} agents inserted`);

  // 3. Products
  console.log('\n3/5 Generating 5,000 products...');
  const productRows = generateProducts(5000);
  const productIds = await batchInsert('products', productRows, 'Products');
  console.log(`   ✓ ${productIds.length} products inserted`);

  // 4. Commission rules
  console.log('\n4/5 Generating 25,000 commission rules (5 seasons × 5,000 products)...');
  const ruleRows = generateCommissionRules(productIds);
  const ruleIds = await batchInsert('commission_rules', ruleRows, 'Commission rules');
  console.log(`   ✓ ${ruleIds.length} commission rules inserted`);

  // Fetch rules back so we have the full objects for commission calculation
  console.log('\n   Fetching commission rules for sales calculation...');
  const { data: fetchedRules, error: rulesErr } = await supabase
    .from('commission_rules')
    .select('id, product_id, season, base_commission_pct, bonus_commission_pct, max_days_for_bonus');
  if (rulesErr) {
    console.error('Failed to fetch commission rules:', rulesErr.message);
    process.exit(1);
  }

  // 5. Sales
  console.log('\n5/5 Generating 50,000 sales records...');
  const salesRows = generateSales(50000, agentIds, productIds, fetchedRules as CommissionRule[]);
  const salesIds = await batchInsert('sales', salesRows, 'Sales');
  console.log(`   ✓ ${salesIds.length} sales inserted`);

  console.log('\n✅ Seed complete!');
  console.log(`   Agencies:         ${agencyIds.length}`);
  console.log(`   Agents:           ${agentIds.length}`);
  console.log(`   Products:         ${productIds.length}`);
  console.log(`   Commission rules: ${ruleIds.length}`);
  console.log(`   Sales:            ${salesIds.length}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
