'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Agency {
  id: string
  name: string
  city: string
  country: string
}

interface Agent {
  id: string
  name: string
  email: string
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
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-12 flex flex-col items-center text-center">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-white mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Search
        </motion.h1>
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search agencies and agents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 rounded-full shadow-lg text-base"
            autoFocus
          />
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
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
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
                        className="border rounded-xl p-4 cursor-pointer hover:scale-[1.01] hover:shadow-md hover:border-[#2E86C1] transition-all bg-card"
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
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
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
                  {results.agents?.map((agent) => (
                    <motion.div key={agent.id} variants={itemVariants}>
                      <div
                        className="border rounded-xl p-4 cursor-pointer hover:scale-[1.01] hover:shadow-md hover:border-[#2E86C1] transition-all bg-card"
                        onClick={() => agent.agency_id && router.push(`/agencies/${agent.agency_id}`)}
                      >
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.email}</p>
                        {agent.agency_name && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {agent.agency_name}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
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
