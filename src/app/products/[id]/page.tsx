'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface CommissionRule {
  season: string
  base_pct: number
  bonus_pct: number
  max_days_for_bonus: number
}

interface Product {
  id: string
  name: string
  type: string
  destination: string
  commission_rules: CommissionRule[]
}

const seasonRowColors: Record<string, string> = {
  peak_summer: 'bg-red-50 dark:bg-red-900/20',
  peak_holiday: 'bg-red-50 dark:bg-red-900/20',
  shoulder: 'bg-yellow-50 dark:bg-yellow-900/20',
  post_school: 'bg-yellow-50 dark:bg-yellow-900/20',
  winter: 'bg-green-50 dark:bg-green-900/20',
}

const typeColors: Record<string, string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-emerald-100 text-emerald-700',
  cruise: 'bg-purple-100 text-purple-700',
  tour: 'bg-orange-100 text-orange-700',
  car: 'bg-gray-100 text-gray-700',
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [id])

  const chartData = product?.commission_rules?.map((r) => ({
    season: r.season.replace(/_/g, ' '),
    base: r.base_pct,
    bonus: r.bonus_pct,
    total: r.base_pct + r.bonus_pct,
  })) ?? []

  return (
    <div>
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/products')}
          className="text-white/70 hover:text-white hover:bg-white/10 mb-4 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {loading ? (
          <Skeleton className="h-8 w-48 bg-white/20" />
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{product?.name}</h1>
              {product?.type && (
                <Badge className={`${typeColors[product.type] ?? 'bg-gray-100 text-gray-700'}`}>
                  {product.type}
                </Badge>
              )}
            </div>
            {product?.destination && (
              <p className="text-white/70 mt-1 text-sm">{product.destination}</p>
            )}
          </motion.div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Commission Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commission Rules by Season</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Season</TableHead>
                      <TableHead className="text-right">Base %</TableHead>
                      <TableHead className="text-right">Bonus %</TableHead>
                      <TableHead className="text-right">Max Days</TableHead>
                      <TableHead className="text-right">Total Potential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product?.commission_rules?.map((rule) => (
                      <TableRow
                        key={rule.season}
                        className={seasonRowColors[rule.season] ?? ''}
                      >
                        <TableCell className="font-medium capitalize">
                          {rule.season.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-right">{rule.base_pct}%</TableCell>
                        <TableCell className="text-right">{rule.bonus_pct}%</TableCell>
                        <TableCell className="text-right">{rule.max_days_for_bonus ?? '—'}</TableCell>
                        <TableCell className="text-right font-semibold text-[#2E86C1]">
                          {rule.base_pct + rule.bonus_pct}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        {!loading && chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission by Season</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="season" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="base" name="Base" fill="#2E86C1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bonus" name="Bonus" fill="#F39C12" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
