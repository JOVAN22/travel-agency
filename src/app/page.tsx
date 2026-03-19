'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  Package,
  DollarSign,
  TrendingUp,
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
    gradient: 'from-[#1B2B5B] to-[#2A3F7E]',
    iconBg: 'bg-white/20',
  },
  {
    label: 'Total Agents',
    value: stats.total_agents,
    icon: Users,
    gradient: 'from-[#2E86C1] to-[#3498DB]',
    iconBg: 'bg-white/20',
  },
  {
    label: 'Total Products',
    value: stats.total_products,
    icon: Package,
    gradient: 'from-emerald-600 to-emerald-500',
    iconBg: 'bg-white/20',
  },
  {
    label: 'Total Revenue',
    value: `$${stats.total_revenue?.toLocaleString() ?? 0}`,
    icon: DollarSign,
    gradient: 'from-[#F39C12] to-[#E67E22]',
    iconBg: 'bg-white/20',
  },
  {
    label: 'Avg Commission',
    value: `${stats.avg_commission_pct?.toFixed(1) ?? 0}%`,
    icon: TrendingUp,
    gradient: 'from-purple-600 to-purple-500',
    iconBg: 'bg-white/20',
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
  0: 'bg-[#F39C12] text-white',
  1: 'bg-gray-400 text-white',
  2: 'bg-amber-700 text-white',
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
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
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Good {timeOfDay}, TravelHub
          </h1>
          <p className="text-white/70 mt-1 text-sm">{dateStr}</p>
        </motion.div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <KPISkeleton key={i} />
            ))}
          </div>
        ) : stats ? (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {kpiCards(stats).map(({ label, value, icon: Icon, gradient }) => (
              <motion.div key={label} variants={itemVariants}>
                <div
                  className={`bg-gradient-to-br ${gradient} rounded-xl p-4 sm:p-5 shadow-lg hover:scale-[1.02] transition-transform cursor-default`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-xs font-medium">{label}</span>
                    <div className="bg-white/20 rounded-lg p-1.5">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-white">{value}</p>
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
                    <Bar dataKey="total_revenue" name="Revenue" fill="#2E86C1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_commission" name="Commission" fill="#F39C12" radius={[4, 4, 0, 0]} />
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
                      <span className="text-xs font-semibold text-[#2E86C1] whitespace-nowrap">
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
                    <div className="w-8 h-8 rounded-full bg-[#2E86C1]/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#2E86C1]" />
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
      </div>
    </motion.div>
  )
}
