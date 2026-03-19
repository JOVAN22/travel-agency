import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type Season =
  | 'post_school_off_peak'
  | 'winter_off_peak'
  | 'peak_summer'
  | 'peak_holiday'
  | 'shoulder';

const SEASON_LABELS: Record<Season, string> = {
  peak_summer: 'Peak Summer',
  peak_holiday: 'Peak Holiday',
  shoulder: 'Shoulder Season',
  post_school_off_peak: 'Post-School Off-Peak',
  winter_off_peak: 'Winter Off-Peak',
};

function getSeason(month: number): Season {
  if (month === 9 || month === 10) return 'post_school_off_peak';
  if (month === 1 || month === 2) return 'winter_off_peak';
  if (month >= 6 && month <= 8) return 'peak_summer';
  if (month === 12) return 'peak_holiday';
  return 'shoulder';
}

interface Recommendation {
  product_name: string;
  product_type: string;
  reason: string;
  estimated_commission_pct: number;
  tip: string;
}

export async function POST(request: NextRequest) {
  try {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  let body: { agent_id?: string; month?: number } = {};
  try {
    body = await request.json();
  } catch (err) {
    console.warn('[optimizer] Could not parse request body, using defaults:', err);
  }

  if (typeof body.month !== 'undefined') {
    if (!Number.isInteger(body.month) || body.month < 1 || body.month > 12) {
      return NextResponse.json({ error: 'month must be an integer between 1 and 12' }, { status: 400 });
    }
  }

  const month = typeof body.month === 'number' ? body.month : new Date().getMonth() + 1;
  const season = getSeason(month);
  const season_label = SEASON_LABELS[season];

  const [productsRes, rulesRes] = await Promise.all([
    supabase.from('products').select('id, name, type').limit(30),
    supabase
      .from('commission_rules')
      .select('product_id, base_commission_pct, bonus_commission_pct, max_days_for_bonus')
      .eq('season', season),
  ]);

  if (productsRes.error) console.error('[optimizer] Supabase products error:', productsRes.error);
  if (rulesRes.error)    console.error('[optimizer] Supabase rules error:', rulesRes.error);
  if (productsRes.error || rulesRes.error) {
    return NextResponse.json({ error: 'Failed to fetch product data from database' }, { status: 500 });
  }

  const products = productsRes.data ?? [];
  const rules = rulesRes.data ?? [];

  const ruleByProduct = new Map(rules.map((r) => [r.product_id, r]));

  const productContext = products
    .map((p) => {
      const r = ruleByProduct.get(p.id);
      const rateText = r
        ? `base ${r.base_commission_pct}%, bonus ${r.bonus_commission_pct}% within ${r.max_days_for_bonus}d`
        : 'no rate for this season';
      return `- ${p.name} (${p.type}): ${rateText}`;
    })
    .join('\n');

  const userMessage = `Current season: ${season_label}. Month: ${month}.\n\nAvailable products:\n${productContext}`;

  let groqResponse: Response;
  try {
    groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content:
              'You are a commission optimization expert for TravelHub. Given the current season and available products with their commission rates, recommend the top 5 products an agent should focus on to maximize earnings. For each product, explain WHY it\'s a good choice right now. Consider base commission, bonus potential, and speed bonuses. Return a JSON object with: { recommendations: [{ product_name, product_type, reason, estimated_commission_pct, tip }] }. Respond ONLY with valid JSON, no markdown backticks or extra text.',
          },
          { role: 'user', content: userMessage },
        ],
      }),
    });
  } catch (err) {
    console.error('Groq API fetch error:', err);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }

  if (!groqResponse.ok) {
    const errBody = await groqResponse.text();
    console.error('[optimizer] Groq API error — status:', groqResponse.status, '| body:', errBody);
    return NextResponse.json(
      { error: `AI service returned ${groqResponse.status}` },
      { status: 502 }
    );
  }

  const groqData = await groqResponse.json();
  const text: string = groqData?.choices?.[0]?.message?.content ?? '{}';

  let recommendations: Recommendation[] = [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.recommendations)) {
      recommendations = parsed.recommendations;
    }
  } catch (parseErr) {
    console.error('[optimizer] Failed to parse Groq JSON response. Raw text:', text, '| Error:', parseErr);
    recommendations = [];
  }

  return NextResponse.json({ season, season_label, month, recommendations });
  } catch (err) {
    console.error('[optimizer] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
