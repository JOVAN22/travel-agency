'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  id: string
  name: string
  type: string
  destination: string
  min_commission_pct?: number
  max_commission_pct?: number
}

const typeColors: Record<string, string> = {
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-emerald-100 text-emerald-700',
  cruise: 'bg-purple-100 text-purple-700',
  tour: 'bg-orange-100 text-orange-700',
  car: 'bg-gray-100 text-gray-700',
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [destination, setDestination] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [types, setTypes] = useState<string[]>([])
  const [destinations, setDestinations] = useState<string[]>([])
  const limit = 12

  const fetchProducts = useCallback(async (t: string, d: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (t) params.set('type', t)
    if (d) params.set('destination', d)
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data.data ?? [])
    setTotal(data.pagination?.total ?? 0)
    if (data.products) {
      const allTypes = [...new Set<string>(data.products.map((p: Product) => p.type).filter(Boolean))]
      const allDests = [...new Set<string>(data.products.map((p: Product) => p.destination).filter(Boolean))]
      setTypes((prev) => [...new Set([...prev, ...allTypes])])
      setDestinations((prev) => [...new Set([...prev, ...allDests])])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(1)
    fetchProducts(type, destination, 1)
  }, [type, destination, fetchProducts])

  useEffect(() => {
    fetchProducts(type, destination, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-10">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Products Catalog
        </motion.h1>
        <p className="text-white/70 mt-1 text-sm">{total} products available</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <div
                  className="border rounded-xl p-5 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-[#2E86C1] transition-all bg-card"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-sm leading-tight flex-1 min-w-0 truncate">
                      {product.name}
                    </h3>
                    {product.type && (
                      <Badge
                        className={`text-xs flex-shrink-0 ${typeColors[product.type] ?? 'bg-gray-100 text-gray-700'}`}
                        variant="secondary"
                      >
                        {product.type}
                      </Badge>
                    )}
                  </div>
                  {product.destination && (
                    <p className="text-xs text-muted-foreground mb-3">{product.destination}</p>
                  )}
                  {(product.min_commission_pct !== undefined || product.max_commission_pct !== undefined) && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2E86C1] to-[#F39C12]"
                          style={{ width: `${Math.min(100, (product.max_commission_pct ?? 0) * 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {product.min_commission_pct}–{product.max_commission_pct}%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={page === n ? 'default' : 'outline'} size="sm" onClick={() => setPage(n)}>
                {n}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
