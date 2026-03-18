'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Product {
  id: string
  name: string
}

interface CommissionResult {
  season: string
  days_to_sell: number
  base_commission_pct: number
  bonus_commission_pct: number
  total_commission_pct: number
  sale_price: number | null
  commission_amount: number | null
}

export default function CalculatorPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [saleDate, setSaleDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [listedDate, setListedDate] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CommissionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/products?page=1&limit=100')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
  }, [])

  const handleCalculate = async () => {
    if (!productId || !saleDate || !departureDate) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const body: Record<string, string | number> = {
        product_id: productId,
        sale_date: saleDate,
        departure_date: departureDate,
      }
      if (listedDate) body.product_listed_date = listedDate
      if (salePrice) body.sale_price = parseFloat(salePrice)

      const res = await fetch('/api/commission/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to calculate')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-10">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Commission Calculator
        </motion.h1>
        <p className="text-white/70 mt-1 text-sm">Calculate commission for any product and date</p>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sale Date *</label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Departure Date *</label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Listed Date</label>
                <Input
                  type="date"
                  value={listedDate}
                  onChange={(e) => setListedDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sale Price (optional)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={!productId || !saleDate || !departureDate || loading}
              className="w-full bg-[#2E86C1] hover:bg-[#2577aa] hover:scale-[1.01] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Commission
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Season */}
              <Card className="border-[#1B2B5B]/20">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Season</p>
                  <p className="font-semibold capitalize">{result.season?.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.days_to_sell} days to sell</p>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Commission Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: 'Base', value: `${result.base_commission_pct}%`, color: 'text-[#2E86C1]' },
                      { label: 'Bonus', value: `${result.bonus_commission_pct}%`, color: 'text-[#F39C12]' },
                      { label: 'Total', value: `${result.total_commission_pct}%`, color: 'text-emerald-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="border rounded-lg p-3">
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dollar amount */}
              {result.commission_amount !== null && result.commission_amount !== undefined && (
                <Card className="bg-gradient-to-br from-[#F39C12] to-[#E67E22] text-white">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-white/80 mb-1">Commission Amount</p>
                    <p className="text-4xl font-bold">
                      ${result.commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
