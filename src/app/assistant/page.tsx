'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, SendHorizonal, Sparkles, AlertCircle, Settings2, X, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Source {
  id: string
  name: string
  type: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  error?: boolean
}

const SUGGESTIONS = [
  'What cruise deals have the best commission this month?',
  'Which products should I focus on for maximum earnings?',
  'Show me the highest bonus opportunities right now',
  'What are the top-selling product types?',
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      <div className="w-8 h-8 rounded-full bg-[#0C1B3A] flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-[#F3F4F6] dark:bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SetupModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'generating' | 'done' | 'error'>('idle')
  const [sql, setSql] = useState('')
  const [message, setMessage] = useState('')
  const [genMessage, setGenMessage] = useState('')

  const checkSetup = async () => {
    setStatus('checking')
    const res = await fetch('/api/setup-embeddings', { method: 'POST' })
    const data = await res.json()
    setSql(data.sql ?? '')
    setMessage(data.message ?? '')
    setStatus(data.status === 'ready' ? 'done' : 'idle')
  }

  const generateDescriptions = async () => {
    setStatus('generating')
    const res = await fetch('/api/generate-descriptions', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setGenMessage(data.message ?? `Updated ${data.updated} products.`)
      setStatus('done')
    } else {
      setGenMessage(data.error ?? 'Failed to generate descriptions.')
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#0770E3]" />
            AI Assistant Setup
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            The AI Assistant works best when products have rich descriptions. Follow these steps to set it up:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0C1B3A] text-white text-xs flex items-center justify-center font-semibold">1</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Check database setup</p>
                <p className="text-xs text-muted-foreground mt-0.5">Verify the description column exists in your products table.</p>
                <button
                  onClick={checkSetup}
                  disabled={status === 'checking'}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-[#F0F7FF] text-[#0770E3] hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {status === 'checking' ? <><RefreshCw className="w-3 h-3 animate-spin" />Checking...</> : 'Check Setup'}
                </button>
                {message && (
                  <p className="text-xs mt-2 text-muted-foreground">{message}</p>
                )}
              </div>
            </div>

            {sql && (
              <div className="ml-9">
                <p className="text-xs text-muted-foreground mb-1">Run this SQL in your Supabase SQL Editor if needed:</p>
                <pre className="text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300">
                  {sql}
                </pre>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0770E3] text-white text-xs flex items-center justify-center font-semibold">2</span>
              <div className="flex-1">
                <p className="text-sm font-medium">Generate product descriptions</p>
                <p className="text-xs text-muted-foreground mt-0.5">Builds rich searchable descriptions for all products using their commission rules.</p>
                <button
                  onClick={generateDescriptions}
                  disabled={status === 'generating' || status === 'checking'}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-[#0770E3] text-white hover:bg-[#0558b0] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {status === 'generating' ? <><RefreshCw className="w-3 h-3 animate-spin" />Generating...</> : 'Generate Descriptions'}
                </button>
                {genMessage && (
                  <p className={cn('text-xs mt-2', status === 'error' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')}>
                    {genMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {status === 'done' && !genMessage && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
              <span>✓</span>
              <span>Setup complete! You can now ask questions about your products.</span>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg bg-[#0770E3] text-white hover:bg-[#0558b0] transition-colors font-semibold"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Build history from existing messages (exclude the new one)
    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 15),
            role: 'assistant',
            content: data.error ?? 'Something went wrong. Please try again.',
            error: true,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 15),
            role: 'assistant',
            content: data.reply,
            sources: data.sources ?? [],
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 15),
          role: 'assistant',
          content: 'Network error. Please check your connection and try again.',
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0770E3]/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#0770E3]" />
          </div>
          <div>
            <h1 className="text-[#161616] dark:text-white font-semibold text-base leading-tight">TravelHub AI</h1>
            <p className="text-[#8F9BA8] dark:text-slate-400 text-xs">Powered by AI · Ask about products &amp; commissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="flex items-center gap-1.5 text-[#545454] dark:text-slate-400 hover:text-[#161616] dark:hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-all"
          title="Setup AI Assistant"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Setup</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length === 0 && !loading ? (
          /* Empty state with suggestions */
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F7FF] dark:bg-slate-800/50 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#0770E3]" />
            </div>
            <h2 className="text-lg font-semibold mb-1 dark:text-white">Ask TravelHub AI</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">
              Get instant answers about products, commission rates, and how to maximize your earnings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-300 bg-transparent dark:bg-slate-800/50 hover:border-[#F39C12] hover:text-[#F39C12] dark:hover:border-[#F39C12] dark:hover:text-[#F39C12] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex items-end gap-2 px-4 py-1',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1',
                      msg.role === 'user'
                        ? 'bg-[#0770E3]'
                        : 'bg-[#0C1B3A]'
                    )}
                  >
                    {msg.role === 'user'
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>

                  {/* Bubble + sources */}
                  <div className={cn('flex flex-col gap-2 max-w-[75%]', msg.role === 'user' ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                        msg.role === 'user'
                          ? 'bg-[#0770E3] text-white rounded-2xl rounded-tr-sm max-w-[75%] self-end'
                          : msg.error
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 rounded-2xl rounded-tl-sm max-w-[75%] self-start'
                            : 'bg-[#F3F4F6] dark:bg-slate-700 text-[#161616] dark:text-white rounded-2xl rounded-tl-sm max-w-[75%] self-start'
                      )}
                    >
                      {msg.error && (
                        <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      )}
                      {msg.content}
                    </div>

                    {/* Source cards */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.slice(0, 6).map((source) => (
                          <Link
                            key={source.id}
                            href={`/products/${source.id}`}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#F0F7FF] text-[#0770E3] border border-[#0770E3]/20 hover:border-[#0770E3]/50 transition-colors"
                          >
                            <span className="font-medium truncate max-w-[120px]">{source.name}</span>
                            <span className="text-[10px] opacity-60 capitalize">{source.type}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products, commissions, or earnings..."
              rows={1}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-[#161616] dark:text-white placeholder-[#8F9BA8] dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0770E3]/50 focus:border-[#0770E3] transition-all disabled:opacity-60 overflow-hidden"
              style={{ minHeight: '48px', maxHeight: '160px' }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#0770E3] hover:bg-[#0558b0] text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2 opacity-60">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
      </AnimatePresence>
    </div>
  )
}
