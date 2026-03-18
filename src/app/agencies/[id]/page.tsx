'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronLeft, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Agent {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

interface Agency {
  id: string
  name: string
  city: string
  country: string
  agents: Agent[]
}

export default function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`/api/agencies/${id}`)
      .then((r) => r.json())
      .then(setAgency)
      .finally(() => setLoading(false))
  }, [id])

  const agents = agency?.agents ?? []
  const filtered = search
    ? agents.filter(
        (a) =>
          a.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.email?.toLowerCase().includes(search.toLowerCase())
      )
    : agents
  const activeCount = agents.filter((a) => a.is_active).length

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2E86C1] px-6 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/agencies')}
          className="text-white/70 hover:text-white hover:bg-white/10 mb-4 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {loading ? (
          <Skeleton className="h-8 w-48 bg-white/20" />
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{agency?.name}</h1>
            <p className="text-white/70 mt-1 text-sm">
              {[agency?.city, agency?.country].filter(Boolean).join(', ')}
            </p>
          </motion.div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Agents', value: agents.length },
            { label: 'Active Agents', value: activeCount },
            { label: 'Inactive Agents', value: agents.length - activeCount },
          ].map(({ label, value }) => (
            <div key={label} className="border rounded-xl p-4 text-center bg-card">
              <p className="text-2xl font-bold">{loading ? '—' : value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Agents Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" /> Agents
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No agents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                        <TableCell className="text-sm">{agent.role}</TableCell>
                        <TableCell>
                          <Badge
                            variant={agent.is_active ? 'default' : 'destructive'}
                            className={
                              agent.is_active
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }
                          >
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
