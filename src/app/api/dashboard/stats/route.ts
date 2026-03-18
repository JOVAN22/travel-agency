import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [
    agenciesCount,
    agentsCount,
    productsCount,
    salesAgg,
    topAgents,
    salesByMonth,
  ] = await Promise.all([
    supabase.from('agencies').select('*', { count: 'exact', head: true }),

    supabase.from('agents').select('*', { count: 'exact', head: true }),

    supabase.from('products').select('*', { count: 'exact', head: true }),

    supabase
      .from('sales')
      .select('sale_price, commission_amount, final_commission_pct'),

    supabase
      .from('sales')
      .select('agent_id, agents(first_name, last_name, agencies(name)), commission_amount')
      .order('commission_amount', { ascending: false })
      .limit(200),

    supabase
      .from('sales')
      .select('sale_date, sale_price, commission_amount')
      .gte(
        'sale_date',
        new Date(
          new Date().setFullYear(new Date().getFullYear() - 1)
        )
          .toISOString()
          .split('T')[0]
      ),
  ]);

  if (agenciesCount.error) {
    return NextResponse.json({ error: agenciesCount.error.message }, { status: 500 });
  }
  if (agentsCount.error) {
    return NextResponse.json({ error: agentsCount.error.message }, { status: 500 });
  }
  if (productsCount.error) {
    return NextResponse.json({ error: productsCount.error.message }, { status: 500 });
  }
  if (salesAgg.error) {
    return NextResponse.json({ error: salesAgg.error.message }, { status: 500 });
  }
  if (topAgents.error) {
    return NextResponse.json({ error: topAgents.error.message }, { status: 500 });
  }
  if (salesByMonth.error) {
    return NextResponse.json({ error: salesByMonth.error.message }, { status: 500 });
  }

  // Aggregate totals
  const allSales = salesAgg.data ?? [];
  const total_sales = allSales.length;
  const total_revenue = allSales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0);
  const avg_commission_pct =
    total_sales > 0
      ? allSales.reduce((sum, s) => sum + (s.final_commission_pct ?? 0), 0) / total_sales
      : 0;

  // Top 5 agents by total commission_amount
  type AgentRow = {
    agent_id: string;
    commission_amount: number;
    agents: { first_name: string; last_name: string; agencies: { name: string } | null } | null;
  };
  const agentTotals = new Map<
    string,
    { agent_id: string; name: string; agency_name: string | null; total_commission: number }
  >();

  for (const row of (topAgents.data ?? []) as AgentRow[]) {
    const existing = agentTotals.get(row.agent_id);
    if (existing) {
      existing.total_commission += row.commission_amount ?? 0;
    } else {
      agentTotals.set(row.agent_id, {
        agent_id: row.agent_id,
        name: row.agents
          ? `${row.agents.first_name} ${row.agents.last_name}`
          : 'Unknown',
        agency_name: row.agents?.agencies?.name ?? null,
        total_commission: row.commission_amount ?? 0,
      });
    }
  }

  const top_agents = [...agentTotals.values()]
    .sort((a, b) => b.total_commission - a.total_commission)
    .slice(0, 5);

  // Sales by month (last 12 months)
  const monthlyMap = new Map<
    string,
    { month: string; total_sales: number; total_revenue: number; total_commission: number }
  >();

  for (const row of salesByMonth.data ?? []) {
    const month = row.sale_date.slice(0, 7); // YYYY-MM
    const existing = monthlyMap.get(month);
    if (existing) {
      existing.total_sales += 1;
      existing.total_revenue += row.sale_price ?? 0;
      existing.total_commission += row.commission_amount ?? 0;
    } else {
      monthlyMap.set(month, {
        month,
        total_sales: 1,
        total_revenue: row.sale_price ?? 0,
        total_commission: row.commission_amount ?? 0,
      });
    }
  }

  const sales_by_month = [...monthlyMap.values()].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  return NextResponse.json({
    total_agencies: agenciesCount.count ?? 0,
    total_agents: agentsCount.count ?? 0,
    total_products: productsCount.count ?? 0,
    total_sales,
    total_revenue: parseFloat(total_revenue.toFixed(2)),
    avg_commission_pct: parseFloat(avg_commission_pct.toFixed(4)),
    top_agents,
    sales_by_month,
  });
}
