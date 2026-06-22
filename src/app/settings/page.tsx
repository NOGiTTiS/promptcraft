'use client'

import React, { useState, useEffect } from 'react'
import { useSettingsStore, AIProvider } from '@/store/settingsStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Eye, EyeOff, Save, Check, RefreshCw, Key, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PROVIDER_MODELS: Record<AIProvider, { value: string; label: string }[]> = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (แนะนำ - เร็ว)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'custom', label: 'ระบุชื่อโมเดลเอง (Custom)' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (แนะนำ - คุ้มค่า)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'custom', label: 'ระบุชื่อโมเดลเอง (Custom)' }
  ],
  anthropic: [
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (แนะนำ - เร็ว)' },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'custom', label: 'ระบุชื่อโมเดลเอง (Custom)' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat (V3 - แนะนำ)' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
    { value: 'custom', label: 'ระบุชื่อโมเดลเอง (Custom)' }
  ]
}

export default function SettingsPage() {
  const store = useSettingsStore()
  
  const [mounted, setMounted] = useState(false)
  const [provider, setProvider] = useState<AIProvider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // จัดการการ Hydration ใน Next.js
  useEffect(() => {
    setMounted(true)
    if (store) {
      setProvider(store.provider)
      setApiKey(store.apiKey)
      
      const predefined = PROVIDER_MODELS[store.provider].map(m => m.value)
      if (predefined.includes(store.modelName) && store.modelName !== 'custom') {
        setSelectedModel(store.modelName)
      } else {
        setSelectedModel('custom')
        setCustomModel(store.modelName)
      }
    }
  }, [store.provider, store.apiKey, store.modelName])

  // ติดตามการเปลี่ยน Provider เพื่อปรับเปลี่ยนโมเดลตั้งต้น
  const handleProviderChange = (val: AIProvider) => {
    setProvider(val)
    const defaults = PROVIDER_MODELS[val]
    setSelectedModel(defaults[0].value)
    setCustomModel('')
  }

  const handleSave = () => {
    setSaveLoading(true)
    setTimeout(() => {
      store.setProvider(provider)
      store.setApiKey(apiKey)
      
      const modelToSave = selectedModel === 'custom' ? customModel : selectedModel
      store.setModelName(modelToSave || PROVIDER_MODELS[provider][0].value)
      
      setSaveLoading(false)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    }, 600)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  const currentModels = PROVIDER_MODELS[provider] || []

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* หัวหน้าเว็บ */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Key className="h-7 w-7 text-indigo-400" />
              <span>ตั้งค่า AI Provider & API Key</span>
            </h1>
            <p className="text-sm text-slate-400">
              กำหนดขุมพลังของ AI และรหัสผ่านการเชื่อมต่อสำหรับการใช้งานในห้องทดสอบ
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>

        {/* ฟอร์มตั้งค่า */}
        <Card className="bg-slate-800 border-slate-700 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>ผู้ให้บริการโมเดลภาษาขนาดใหญ่ (LLM Provider)</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              คีย์ที่คุณกรอกจะถูกเก็บไว้ที่ <strong>Web Browser (Local Storage)</strong> ของคุณเท่านั้น ไม่มีการส่งไปเก็บไว้บนเซิร์ฟเวอร์หลักเพื่อความปลอดภัยสูงสุด
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 1. เลือก Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider-select" className="text-indigo-300 font-semibold">
                เลือก AI Provider
              </Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger id="provider-select" className="w-full bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="เลือก AI Provider" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="deepseek">DeepSeek AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. เลือก Model */}
            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-indigo-300 font-semibold">
                รุ่นโมเดล (Model)
              </Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select" className="w-full bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="เลือกโมเดลที่ต้องการ" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {currentModels.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* กรณีกรอก Custom Model เอง */}
            {selectedModel === 'custom' && (
              <div className="space-y-2 animate-fadeIn">
                <Label htmlFor="custom-model-input" className="text-slate-400 text-xs">
                  ระบุชื่อโมเดลตรง ๆ (เช่น gemini-2.0-pro-exp-02-05 หรือ gpt-4-turbo)
                </Label>
                <Input
                  id="custom-model-input"
                  placeholder="ใส่ชื่อโมเดลระบุเจาะจง..."
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            )}

            {/* 3. กรอก API Key */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="api-key-input" className="text-indigo-300 font-semibold">
                  API Key ของผู้ให้บริการ
                </Label>
                {provider === 'gemini' && (
                  <span className="text-xs text-slate-500">
                    (หากเว้นว่างไว้ จะใช้ API Key ส่วนกลางของระบบหลังบ้านเป็นค่าเริ่มต้น)
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  placeholder={
                    provider === 'gemini' 
                      ? 'AIzaSy...' 
                      : provider === 'openai' 
                        ? 'sk-proj-...' 
                        : provider === 'anthropic' 
                          ? 'sk-ant-...' 
                          : 'sk-...'
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-slate-400 hover:text-white transition"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5 mt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300">ความปลอดภัยของข้อมูล:</span>
                  <p className="mt-0.5">
                    กุญแจ API นี้ถูกเก็บบนเว็บเบราว์เซอร์ของคุณ เมื่อทำการส่งประเมิน จะส่งผ่าน HTTPS ไปยังหลังบ้านเพื่อเป็น Proxy ส่งต่อไปยัง API ปลายทางอย่างเป็นทางการเท่านั้น
                  </p>
                </div>
              </div>
            </div>

          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-700/50 pt-4">
            <div className="flex items-center gap-2">
              {isSaved && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold animate-pulse">
                  <Check className="h-4 w-4" />
                  <span>บันทึกการตั้งค่าสำเร็จ!</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSave}
              disabled={saveLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-2 px-6"
            >
              {saveLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>บันทึกการตั้งค่า</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
