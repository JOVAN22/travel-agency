import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SaleWithProduct {
  sale_price: number | null;
  commission_amount: number | null;
  final_commission_pct: number | null;
  sale_date: string;
  agent_id: string;
  products: { type: string } | null;
}

interface SaleWithAgent {
  agent_id: string;
  commission_amount: number | null;
  agents: { first_name: string; last_name: string } | null;
}

export async function GET() {
  try {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  // Fetch data in parallel
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

  const [salesByProductRes, topAgentsRes, salesTrendRes] = await Promise.all([
    supabase
      .from('sales')
      .select('sale_price, commission_amount, final_commission_pct, sale_date, agent_id, products(type)')
      .limit(1000),

    supabase
      .from('sales')
      .select('agent_id, agents(first_name, last_name), commission_amount')
      .order('commission_amount', { ascending: false })
      .limit(200),

    supabase
      .from('sales')
      .select('sale_date, sale_price')
      .gte('sale_date', sixMonthsAgoStr),
  ]);

  if (salesByProductRes.error) console.error('[insights] Supabase salesByProduct error:', salesByProductRes.error);
  if (topAgentsRes.error)      console.error('[insights] Supabase topAgents error:', topAgentsRes.error);
  if (salesTrendRes.error)     console.error('[insights] Supabase salesTrend error:', salesTrendRes.error);

  // Sales by product type
  const productTypeTotals = new Map<string, { count: number; revenue: number }>();
  for (const row of (salesByProductRes.data ?? []) as unknown as SaleWithProduct[]) {
    const type = row.products?.type ?? 'Unknown';
    const existing = productTypeTotals.get(type) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += row.sale_price ?? 0;
    productTypeTotals.set(type, existing);
  }

  const salesByType = [...productTypeTotals.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([type, { count, revenue }]) => `${type}: ${count} sales, $${revenue.toFixed(0)} revenue`);

  // Top 5 agents
  const agentTotals = new Map<string, { name: string; total: number }>();
  for (const row of (topAgentsRes.data ?? []) as unknown as SaleWithAgent[]) {
    const existing = agentTotals.get(row.agent_id);
    if (existing) {
      existing.total += row.commission_amount ?? 0;
    } else {
      agentTotals.set(row.agent_id, {
        name: row.agents ? `${row.agents.first_name} ${row.agents.last_name}` : 'Unknown',
        total: row.commission_amount ?? 0,
      });
    }
  }
  const top5Agents = [...agentTotals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.name}: $${a.total.toFixed(0)}`);

  // Avg commission rate
  const allSales = (salesByProductRes.data ?? []) as unknown as SaleWithProduct[];
  const validPcts = allSales.filter((s) => s.final_commission_pct != null);
  const avgCommission =
    validPcts.length > 0
      ? validPcts.reduce((sum, s) => sum + (s.final_commission_pct ?? 0), 0) / validPcts.length
      : 0;

  // Sales trend: last 3 months vs previous 3 months
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

  const trendData = (salesTrendRes.data ?? []) as { sale_date: string; sale_price: number | null }[];
  let recent3 = 0;
  let prev3 = 0;
  for (const row of trendData) {
    const rev = row.sale_price ?? 0;
    if (row.sale_date >= threeMonthsAgoStr) {
      recent3 += rev;
    } else {
      prev3 += rev;
    }
  }
  const trendPct = prev3 > 0 ? (((recent3 - prev3) / prev3) * 100).toFixed(1) : 'N/A';

  const statsSummary = `
Sales by product type: ${salesByType.join('; ')}
Top 5 agents by commission: ${top5Agents.join('; ')}
Average commission rate: ${avgCommission.toFixed(2)}%
Revenue trend (last 3 months vs previous 3 months): $${recent3.toFixed(0)} vs $${prev3.toFixed(0)} (${trendPct}% change)
`.trim();

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
              'You are a data analyst for TravelHub. Given these sales statistics, generate exactly 4 brief, actionable insights. Each insight should be 1-2 sentences. Focus on trends, opportunities, and recommendations. Format as a JSON array of strings. Respond ONLY with valid JSON, no markdown backticks or extra text.',
          },
          { role: 'user', content: statsSummary },
        ],
      }),
    });
  } catch (err) {
    console.error('Groq API fetch error:', err);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }

  if (!groqResponse.ok) {
    const errBody = await groqResponse.text();
    console.error('[insights] Groq API error — status:', groqResponse.status, '| body:', errBody);
    return NextResponse.json(
      { error: `AI service returned ${groqResponse.status}` },
      { status: 502 }
    );
  }

  const groqData = await groqResponse.json();
  const text: string = groqData?.choices?.[0]?.message?.content ?? '[]';

  let insights: string[] = [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      insights = parsed.filter((s): s is string => typeof s === 'string');
    }
  } catch (parseErr) {
    console.error('[insights] Failed to parse Groq JSON response. Raw text:', text, '| Error:', parseErr);
    insights = ['Unable to parse AI response. Please try refreshing.'];
  }

  return NextResponse.json({ insights });
  } catch (err) {
    console.error('[insights] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
