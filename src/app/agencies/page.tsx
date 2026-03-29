'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Building2, ChevronLeft, ChevronRight, MapPin, Users, ArrowUpRight } from 'lucide-react'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { CardSkeleton } from '@/Components/Skeleton'

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
      {/* Header */}
      <div className="px-6 pt-8 pb-5 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-[#161616] dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Agencies
        </motion.h1>
        <p className="text-[#8F9BA8] dark:text-slate-400 mt-1 text-sm">{total} agencies total</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
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
                <Link
                  href={`/agencies/${agency.id}`}
                  className="group block bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 border-l-4 border-l-[#0770E3] rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-[#0770E3] transition-colors text-[#161616] dark:text-white">
                        {agency.name}
                      </h3>
                      {(agency.city || agency.country) && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-[#8F9BA8] dark:text-slate-400">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {[agency.city, agency.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8F9BA8] group-hover:text-[#0770E3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#F0F7FF] dark:bg-slate-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#0770E3]" />
                    </div>
                    {agency.agent_count !== undefined && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0F7FF] dark:bg-slate-700 text-[#0770E3] dark:text-blue-400">
                        <Users className="w-3 h-3" />
                        {agency.agent_count} agent{agency.agent_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
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
