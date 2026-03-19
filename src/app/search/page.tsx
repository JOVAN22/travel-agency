'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Building2, Mail, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Agency {
  id: string
  name: string
  city: string
  country: string
}

interface Agent {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
  agency_name?: string
  agency_id?: string
}

interface SearchResults {
  agencies: Agency[]
  agents: Agent[]
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const totalResults = (results?.agencies?.length ?? 0) + (results?.agents?.length ?? 0)

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-8 pb-4 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
        <h1 className="text-2xl font-bold text-[#161616] dark:text-white mb-4">Search</h1>
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#161616] dark:text-slate-400 z-10 pointer-events-none" />
          <input
            placeholder="Search agencies and agents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-11 py-3 rounded-full bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 text-[#161616] dark:text-white placeholder-[#8F9BA8] dark:placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-[#0770E3]/50 focus:border-[#0770E3] transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8F9BA8] hover:text-[#545454] transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {results && (
          <Badge variant="secondary" className="mt-3 text-xs">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="p-6">
        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">Start searching...</p>
            <p className="text-sm mt-1">Search for agencies or agents</p>
          </div>
        )}

        {query && !loading && results && totalResults === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">No results for &apos;{query}&apos;</p>
          </div>
        )}

        {results && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Agencies */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-xs text-[#8F9BA8] dark:text-slate-400 uppercase tracking-wide">
                <Building2 className="w-4 h-4" />
                Agencies ({results.agencies?.length ?? 0})
              </h2>
              <AnimatePresence>
                <motion.div
                  className="space-y-2"
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                >
                  {results.agencies?.map((agency) => (
                    <motion.div key={agency.id} variants={itemVariants}>
                      <div
                        className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/agencies/${agency.id}`)}
                      >
                        <p className="font-medium text-sm">{agency.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[agency.city, agency.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {results.agencies?.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No agencies found</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Agents */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-xs text-[#8F9BA8] dark:text-slate-400 uppercase tracking-wide">
                <User className="w-4 h-4" />
                Agents ({results.agents?.length ?? 0})
              </h2>
              <AnimatePresence>
                <motion.div
                  className="space-y-2"
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                >
                  {results.agents?.map((agent) => {
                    const fullName = [agent.first_name, agent.last_name].filter(Boolean).join(' ')
                    const initials = [agent.first_name?.[0], agent.last_name?.[0]].filter(Boolean).join('').toUpperCase()
                    return (
                      <motion.div key={agent.id} variants={itemVariants}>
                        <div
                          className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => agent.agency_id && router.push(`/agencies/${agent.agency_id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0C1B3A] flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-semibold">{initials || '?'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base leading-tight">{fullName}</p>
                              {agent.role && (
                                <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            {agent.email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{agent.email}</span>
                              </div>
                            )}
                            {agent.agency_name && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{agent.agency_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  {results.agents?.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No agents found</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
