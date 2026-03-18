'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Agency {
  id: string
  name: string
  city: string
  country: string
  agent_count?: number
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
}

export default function AgenciesPage() {
  const router = useRouter()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 12

  const fetchAgencies = useCallback(async (q: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (q) params.set('search', q)
    const res = await fetch(`/api/agencies?${params}`)
    const data = await res.json()
    setAgencies(data.data ?? [])
    setTotal(data.pagination?.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchAgencies(search, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchAgencies])

  useEffect(() => {
    fetchAgencies(search, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-10">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Agencies
        </motion.h1>
        <p className="text-white/70 mt-1 text-sm">{total} agencies total</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : agencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No agencies found</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {agencies.map((agency) => (
              <motion.div key={agency.id} variants={itemVariants}>
                <div
                  className="border rounded-xl p-5 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:border-[#2E86C1] transition-all bg-card"
                  onClick={() => router.push(`/agencies/${agency.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate">{agency.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {[agency.city, agency.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    {agency.agent_count !== undefined && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {agency.agent_count} agents
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1B2B5B]/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#1B2B5B]" />
                    </div>
                    <span className="text-xs text-[#2E86C1] font-medium">View details →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
