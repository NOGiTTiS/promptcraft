'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSettingsStore } from '@/store/settingsStore'
import { Sparkles, Settings, Layout } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function NavigationHeader() {
  const pathname = usePathname()
  const store = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const providerNames: Record<string, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI GPT',
    anthropic: 'Anthropic Claude',
    deepseek: 'DeepSeek AI'
  }

  const activeProvider = mounted ? store.provider : 'gemini'
  const hasKey = mounted ? !!store.apiKey : false
  const activeModel = mounted ? store.modelName : 'gemini-2.5-flash'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* โลโก้แบรนด์ */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600/20 transition-all duration-300">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            PromptCraft
          </span>
          <span className="text-[10px] text-slate-500 font-mono self-end mb-1">v1.2</span>
        </Link>

        {/* เมนูการนำทางและสถานะ */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                pathname === '/' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}>
                <Layout className="h-4 w-4" />
                <span className="hidden sm:inline">ห้อง Sandbox</span>
                <span className="sm:hidden">Sandbox</span>
              </span>
            </Link>
            <Link href="/settings">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                pathname === '/settings' 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}>
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">ตั้งค่า API</span>
                <span className="sm:hidden">ตั้งค่า</span>
              </span>
            </Link>
          </nav>

          {/* แสดงรายละเอียด Provider ปัจจุบัน */}
          {mounted && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
              <span className="text-slate-500">Provider:</span>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1">
                <span className={`h-1.5 w-1.5 rounded-full ${hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-300 font-medium">{providerNames[activeProvider] || activeProvider}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-mono text-[10px]">{activeModel}</span>
                {hasKey ? (
                  <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-900 ml-1.5 text-[9px] h-4">Custom Key</Badge>
                ) : (
                  <Badge className="bg-slate-950 text-slate-400 border-slate-800 ml-1.5 text-[9px] h-4">Server Key</Badge>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
