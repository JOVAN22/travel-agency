'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { KPISkeleton } from '@/components/Skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  total_agencies: number
  total_agents: number
  total_products: number
  total_revenue: number
  avg_commission_pct: number
  sales_by_month: { month: string; total_revenue: number; total_commission: number }[]
  top_agents: {
    agent_id: string
    name: string
    agency_name: string | null
    total_commission: number
  }[]
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}
const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
}

const kpiCards = (stats: DashboardStats) => [
  {
    label: 'Total Agencies',
    value: stats.total_agencies,
    icon: Building2,
    accentBorder: 'border-l-[#0770E3]',
    iconBg: 'bg-[#0770E3]/10',
    iconColor: 'text-[#0770E3]',
  },
  {
    label: 'Total Agents',
    value: stats.total_agents,
    icon: Users,
    accentBorder: 'border-l-[#8B5CF6]',
    iconBg: 'bg-[#8B5CF6]/10',
    iconColor: 'text-[#8B5CF6]',
  },
  {
    label: 'Total Products',
    value: stats.total_products,
    icon: Package,
    accentBorder: 'border-l-[#1BAC4B]',
    iconBg: 'bg-[#1BAC4B]/10',
    iconColor: 'text-[#1BAC4B]',
  },
  {
    label: 'Total Revenue',
    value: `$${stats.total_revenue?.toLocaleString() ?? 0}`,
    icon: DollarSign,
    accentBorder: 'border-l-[#FF6B00]',
    iconBg: 'bg-[#FF6B00]/10',
    iconColor: 'text-[#FF6B00]',
  },
  {
    label: 'Avg Commission',
    value: `${stats.avg_commission_pct?.toFixed(1) ?? 0}%`,
    icon: TrendingUp,
    accentBorder: 'border-l-[#0770E3]',
    iconBg: 'bg-[#0770E3]/10',
    iconColor: 'text-[#0770E3]',
  },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg p-3 text-white text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

const rankColors: Record<number, string> = {
  0: 'bg-[#F59E0B] text-white',
  1: 'bg-[#9CA3AF] text-white',
  2: 'bg-[#92400E] text-white',
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<string[] | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  async function fetchInsights() {
    setInsightsLoading(true)
    try {
      const res = await fetch('/api/ai/insights')
      const data = await res.json()
      setInsights(data.insights ?? [])
    } catch (err) {
      console.error('Insights fetch error:', err)
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
    fetchInsights()
  }, [])

  const now = new Date()
  const timeOfDay =
    now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 px-6 pt-8 pb-6 border-b border-[#E5E7EB] dark:border-slate-700">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#161616] dark:text-white">
            Good {timeOfDay}, TravelHub
          </h1>
          <p className="text-[#8F9BA8] dark:text-slate-400 mt-1 text-sm">{dateStr}</p>
        </motion.div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <KPISkeleton key={i} />
            ))}
          </div>
        ) : stats ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {kpiCards(stats).map(({ label, value, icon: Icon, accentBorder, iconBg, iconColor }) => (
              <motion.div key={label} variants={itemVariants}>
                <div
                  className={`bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 border-l-4 ${accentBorder} rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow cursor-default`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#8F9BA8] dark:text-slate-400 text-xs font-medium">{label}</span>
                    <div className={`${iconBg} rounded-lg p-1.5`}>
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-[#161616] dark:text-white">{value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Sales by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats?.sales_by_month ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total_revenue" name="Revenue" fill="#0770E3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_commission" name="Commission" fill="#1BAC4B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer> 
              )}
            </CardContent>
          </Card>

          {/* Top Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))
                : stats?.top_agents?.slice(0, 5).map((agent, i) => (
                    <div key={agent.agent_id} className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          rankColors[i] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{agent.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{agent.agency_name}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#0770E3] whitespace-nowrap">
                        ${agent.total_commission?.toLocaleString()}
                      </span>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {!loading && stats?.sales_by_month && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...stats.sales_by_month].reverse().slice(0, 3).map((item) => (
                  <div key={item.month} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="w-8 h-8 rounded-full bg-[#0770E3]/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#0770E3]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.month}</p>
                      <p className="text-xs text-muted-foreground">Revenue recorded</p>
                    </div>
                    <span className="text-sm font-semibold">${item.total_revenue?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        <Card>
          <div className="bg-[#0C1B3A] rounded-t-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <h2 className="text-white font-semibold">AI Insights</h2>
            </div>
            <button
              onClick={fetchInsights}
              disabled={insightsLoading}
              className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Refresh Insights
            </button>
          </div>
          <CardContent className="pt-4 space-y-3">
            {insightsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Skeleton className="w-4 h-4 mt-0.5 flex-shrink-0 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : insights && insights.length > 0 ? (
              insights.map((insight, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Lightbulb className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Loading insights…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
