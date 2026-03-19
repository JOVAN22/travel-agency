import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface AgentRow {
  agent_id: string;
  commission_amount: number;
  agents: { first_name: string; last_name: string; agencies: { name: string } | null } | null;
}

interface SaleRow {
  sale_price: number | null;
  commission_amount: number | null;
  final_commission_pct: number | null;
}

interface SaleByMonthRow {
  sale_date: string;
  sale_price: number | null;
  commission_amount: number | null;
}

interface TopAgent {
  agent_id: string;
  name: string;
  agency_name: string | null;
  total_commission: number;
}

interface MonthlyStats {
  month: string;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
}

interface DashboardStatsResponse {
  total_agencies: number;
  total_agents: number;
  total_products: number;
  total_sales: number;
  total_revenue: number;
  avg_commission_pct: number;
  top_agents: TopAgent[];
  sales_by_month: MonthlyStats[];
}

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
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
  if (agentsCount.error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
  if (productsCount.error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
  if (salesAgg.error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
  if (topAgents.error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
  if (salesByMonth.error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }

  // Aggregate totals
  const allSales = (salesAgg.data ?? []) as unknown as SaleRow[];
  const total_sales = allSales.length;
  const total_revenue = allSales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0);
  const avg_commission_pct =
    total_sales > 0
      ? allSales.reduce((sum, s) => sum + (s.final_commission_pct ?? 0), 0) / total_sales
      : 0;

  // Top 5 agents by total commission_amount
  const agentTotals = new Map<string, TopAgent>();

  for (const row of (topAgents.data ?? []) as unknown as AgentRow[]) {
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
  const monthlyMap = new Map<string, MonthlyStats>();

  for (const row of (salesByMonth.data ?? []) as unknown as SaleByMonthRow[]) {
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

  const response: DashboardStatsResponse = {
    total_agencies: agenciesCount.count ?? 0,
    total_agents: agentsCount.count ?? 0,
    total_products: productsCount.count ?? 0,
    total_sales,
    total_revenue: parseFloat(total_revenue.toFixed(2)),
    avg_commission_pct: parseFloat(avg_commission_pct.toFixed(4)),
    top_agents,
    sales_by_month,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
