import { cn } from '@/lib/utils'

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-card space-y-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Pulse className="h-4 w-3/4" />
          <Pulse className="h-3 w-1/2" />
        </div>
        <Pulse className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Pulse className="h-8 w-8 rounded-full" />
        <Pulse className="h-3 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Pulse className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

export function KPISkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl p-4 sm:p-5 bg-muted/50 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-7 w-7 rounded-lg" />
      </div>
      <Pulse className="h-7 w-16" />
    </div>
  )
}
