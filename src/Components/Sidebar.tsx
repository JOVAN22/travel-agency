'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Building2,
  Package,
  Search,
  Calculator,
  Upload,
  Plane,
  Moon,
  Sun,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', mobileLabel: 'Dashboard', icon: LayoutDashboard },
  { href: '/agencies', label: 'Agencies', mobileLabel: 'Agencies', icon: Building2 },
  { href: '/products', label: 'Products', mobileLabel: 'Products', icon: Package },
  { href: '/search', label: 'Search', mobileLabel: 'Search', icon: Search },
  { href: '/calculator', label: 'Calculator', mobileLabel: 'Calc', icon: Calculator },
  { href: '/assistant', label: 'AI Assistant', mobileLabel: 'AI', icon: Bot },
  { href: '/upload', label: 'Upload', mobileLabel: 'Upload', icon: Upload },
]

const mobileLinks = navLinks.slice(0, 6)

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#1B2B5B] z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F39C12]">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Travel<span className="text-[#F39C12]">Hub</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'text-[#F39C12] bg-white/10 border-l-2 border-[#F39C12] pl-[10px]'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Dark mode toggle */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around px-2 h-full">
          {mobileLinks.map(({ href, mobileLabel, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-medium transition-colors min-w-0',
                  active
                    ? 'text-[#2E86C1]'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{mobileLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
