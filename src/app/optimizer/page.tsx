'use client'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/Components/ui/card'
import { Skeleton } from '@/Components/ui/skeleton'

interface Recommendation {
  product_name: string
  product_type: string
  reason: string
  estimated_commission_pct: number
  tip: string
}

function getSeasonLabel(month: number): string {
  if (month === 9 || month === 10) return 'Post-School Off-Peak'
  if (month === 1 || month === 2) return 'Winter Off-Peak'
  if (month >= 6 && month <= 8) return 'Peak Summer'
  if (month === 12) return 'Peak Holiday'
  return 'Shoulder Season'
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function rankBorderClass(index: number): string {
  if (index === 0) return 'border-l-4 border-l-[#F59E0B]'
  if (index <= 2) return 'border-l-4 border-l-[#0770E3]'
  return 'border-l-4 border-l-[#E5E7EB]'
}

function rankBadgeClass(index: number): string {
  if (index === 0) return 'bg-[#F59E0B] text-white'
  if (index <= 2) return 'bg-[#0770E3] text-white'
  return 'bg-[#9CA3AF] text-white'
}

export default function OptimizerPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [season_label, setSeasonLabel] = useState<string | null>(null)
  const [month, setMonth] = useState<number | null>(null)

  const currentMonth = new Date().getMonth() + 1
  const currentSeasonLabel = season_label ?? getSeasonLabel(currentMonth)
  const currentMonthName = MONTH_NAMES[(month ?? currentMonth) - 1]

  async function fetchRecommendations() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setRecommendations(data.recommendations ?? [])
      setSeasonLabel(data.season_label ?? null)
      setMonth(data.month ?? null)
    } catch (err) {
      console.error('Optimizer fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-8 pb-5 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#F0F7FF] dark:bg-slate-700 rounded-lg p-2">
            <TrendingUp className="w-6 h-6 text-[#0770E3]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#161616] dark:text-white">Commission Optimizer</h1>
        </div>
        <p className="text-[#8F9BA8] dark:text-slate-300 text-sm mt-1">
          {currentMonthName} {new Date().getFullYear()} — {currentSeasonLabel}
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations to maximize your commission earnings this season.
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="bg-[#0770E3] hover:bg-[#0558b0] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Analyzing…' : 'Get Recommendations'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-slate-200">
                <CardContent className="pt-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <Card
                key={i}
                className={`bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 ${rankBorderClass(i)} hover:shadow-md transition-shadow`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBadgeClass(i)}`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm text-[#161616] dark:text-white">{rec.product_name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-[#F3F4F6] dark:bg-slate-700 rounded-full text-[#545454] dark:text-slate-300">
                          {rec.product_type}
                        </span>
                        <span className="text-xs font-bold text-[#F59E0B] ml-auto">
                          ~{rec.estimated_commission_pct}%
                        </span>
                      </div>
                      <p className="text-sm text-[#545454] dark:text-slate-300 mb-2">{rec.reason}</p>
                      {rec.tip && (
                        <div className="bg-[#F0F7FF] dark:bg-slate-700 border border-[#0770E3]/20 dark:border-slate-600 rounded-lg px-3 py-2">
                          <p className="text-xs text-[#0770E3] dark:text-blue-400">
                            <span className="font-semibold">Pro tip:</span> {rec.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-8 pb-8 text-center">
              <TrendingUp className="w-10 h-10 text-muted-foreground dark:text-slate-600 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Click &quot;Get Recommendations&quot; to see AI-powered commission optimization tips for this season.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
