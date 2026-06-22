'use client'

import React, { useState, useEffect } from 'react'
import { usePromptStore } from '@/store/promptStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clipboard, RefreshCw, Send, Sparkles } from 'lucide-react'

// ประกาศคุณลักษณะจำกัดของชุดข้อมูลที่ส่งข้ามมาจากตัว Server Component
interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  expectedFormat: string
  systemPrompt: string
}

interface PromptCraftSandboxProps {
  challenges: Challenge[]
  userId: string
}

export function PromptCraftSandbox({ challenges, userId }: PromptCraftSandboxProps) {
  // ดึงชุดฟังก์ชันหลักออกจาก Zustand Store ที่ออกแบบไว้ในสเต็ปที่ 3
  const { 
    task, context, examples, persona, format, tone,
    setField, currentChallengeId, setChallengeId, resetFields, compilePrompt 
  } = usePromptStore()

  const settings = useSettingsStore()
  const [mounted, setMounted] = useState<boolean>(false)

  const [aiResponse, setAiResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)

  // เฝ้าติดตามการสลับตัวเลือกของขุมโจทย์เพื่อทำการปรับเปลี่ยนสถานะ
  useEffect(() => {
    setMounted(true)
    if (currentChallengeId) {
      const challenge = challenges.find(c => c.id === currentChallengeId)
      setSelectedChallenge(challenge || null)
    } else {
      setSelectedChallenge(null)
    }
  }, [currentChallengeId, challenges])

  // คำนวณข้อความที่ประกอบร่างสำเร็จตลอดเวลา
  const compiledPrompt = compilePrompt()

  // ฟังก์ชันสลับโจทย์ภารกิจประจำตัว
  const handleChallengeChange = (value: string) => {
    if (value === 'free-style') {
      setChallengeId(null)
    } else {
      setChallengeId(value)
    }
    setAiResponse('')
  }

  // ฟังก์ชันล้างค่าข้อมูลเพื่อเริ่มเขียนใหม่
  const handleClearAll = () => {
    resetFields()
    setAiResponse('')
  }

  // ฟังก์ชันคัดลอกข้อความไปที่คลิปบอร์ด
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(compiledPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ฟังก์ชันส่งคำสั่งไปทดสอบกับทาง API หลังบ้านแบบ Stream
  const handleSubmitPrompt = async () => {
    if (!compiledPrompt.trim()) return

    setIsLoading(true)
    setAiResponse('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: compiledPrompt,
          challengeId: currentChallengeId,
          userId: userId,
          provider: settings.provider,
          apiKey: settings.apiKey,
          modelName: settings.modelName
        })
      })

      if (!response.ok) {
        // ลองอ่าน error message
        const errText = await response.text()
        throw new Error(errText || 'เกิดปัญหาในการประมวลผลคำตอบจากระบบหลังบ้าน')
      }

      // ใช้งาน Web Stream Reader เพื่อดูดซับคำศัพท์ที่ส่งกลับแบบพิมพ์ตอบทีละตัวอักษร
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunkText = decoder.decode(value)
          setAiResponse(prev => prev + chunkText)
        }
      }

    } catch (error: any) {
      console.error(error)
      setAiResponse(`❌ เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถสื่อสารกับ AI ได้ในขณะนี้'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ────────────────── แผงควบคุมฝั่งซ้าย: ตัวประกอบคำสั่ง (6 Elements) ────────────────── */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* การ์ดเลือกโจทย์การเรียนรู้ */}
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>เลือกโจทย์หรือภารกิจการเรียนรู้</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              ฝึกเขียน Prompt ตามที่ภารกิจมอบหมาย หรือเลือกอิสระเพื่อสร้างสรรค์ไอเดียของตัวเอง
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select 
              value={currentChallengeId || 'free-style'} 
              onValueChange={handleChallengeChange}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="เลือกโจทย์เพื่อประเมินผลงาน" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="free-style">อิสระ (Sandbox Free-style)</SelectItem>
                {challenges.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.difficulty === 'EASY' && '🟢 '}
                    {c.difficulty === 'MEDIUM' && '🟡 '}
                    {c.difficulty === 'HARD' && '🔴 '}
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* แสดงรายละเอียดภารกิจปัจจุบันที่ผู้เรียนต้องทำตามให้ผ่าน */}
            {selectedChallenge && (
              <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">รายละเอียดภารกิจ</span>
                  <Badge variant={selectedChallenge.difficulty === 'EASY' ? 'default' : selectedChallenge.difficulty === 'MEDIUM' ? 'secondary' : 'destructive'}>
                    ระดับ: {selectedChallenge.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-line">{selectedChallenge.description}</p>
                <div className="text-xs text-slate-500 pt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>รูปแบบตอบกลับที่ AI คาดหวัง: <strong>{selectedChallenge.expectedFormat}</strong></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* แผงฟอร์มสร้างแบบ 6 องค์ประกอบหลักตามสไลด์ที่ 66 */}
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>ตัวต่อประกอบร่าง Prompt</CardTitle>
              <CardDescription className="text-slate-400">
                เติมคำสั่งในกล่องข้อมูลต่างๆ เพื่อเรียนรู้โครงสร้างของคำสั่งที่มีประสิทธิภาพ
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearAll} className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              ล้างค่า
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* 1. Persona - บทบาทสมมุติ */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="persona" className="text-indigo-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-500 text-xs">1.</span> บทบาท (Persona)
                </Label>
                <span className="text-xs text-slate-500">(เช่น คุณคือเชฟอาหารคลีนผู้เชี่ยวชาญ)</span>
              </div>
              <Textarea 
                id="persona" 
                placeholder="สวมบทบาทเป็น..." 
                className="bg-slate-900 border-slate-700 text-white min-h-[50px] resize-none"
                value={persona}
                onChange={(e) => setField('persona', e.target.value)}
              />
            </div>

            {/* 2. Task / Instruction - คำสั่งหลัก */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="task" className="text-indigo-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-500 text-xs">2.</span> คำสั่งหลัก (Task) <span className="text-rose-500">*จำเป็น*</span>
                </Label>
                <span className="text-xs text-slate-500">(เช่น ช่วยเขียนสรุปข้อมูล, ออกแบบเมนูอาหาร)</span>
              </div>
              <Textarea 
                id="task" 
                placeholder="ระบุสิ่งที่ต้องการให้ AI ทำอย่างชัดเจน..." 
                className="bg-slate-900 border-slate-700 text-white min-h-[80px]"
                value={task}
                onChange={(e) => setField('task', e.target.value)}
              />
            </div>

            {/* 3. Context - ข้อมูลบริบท */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="context" className="text-indigo-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-500 text-xs">3.</span> บริบทแวดล้อม (Context)
                </Label>
                <span className="text-xs text-slate-500">(เช่น กลุ่มเป้าหมายคือเด็กอนุบาล, สำหรับช่วงเวลาฝนตก)</span>
              </div>
              <Textarea 
                id="context" 
                placeholder="ข้อมูลเพิ่มเติมเพื่อจำกัดกรอบความคิดของ AI..." 
                className="bg-slate-900 border-slate-700 text-white min-h-[50px] resize-none"
                value={context}
                onChange={(e) => setField('context', e.target.value)}
              />
            </div>

            {/* 4. Examples - ตัวอย่างคำตอบ */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="examples" className="text-indigo-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-500 text-xs">4.</span> ตัวอย่างข้อความ (Examples)
                </Label>
                <span className="text-xs text-slate-500">(เทคนิค One-Shot หรือ Few-Shot)</span>
              </div>
              <Textarea 
                id="examples" 
                placeholder="ตัวอย่างผลลัพธ์ที่ต้องการเพื่อนำไปปรับเทียบคำตอบ..." 
                className="bg-slate-900 border-slate-700 text-white min-h-[50px] resize-none"
                value={examples}
                onChange={(e) => setField('examples', e.target.value)}
              />
            </div>

            {/* 5. Format & Style - รูปแบบผลลัพธ์ */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="format" className="text-indigo-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-500 text-xs">5.</span> รูปแบบแสดงผล (Format)
                </Label>
                <span className="text-xs text-slate-500">(เช่น แสดงผลเป็นตาราง, Bullet points, ความยาวไม่เกิน 100 คำ)</span>
              </div>
              <Textarea 
                id="format" 
                placeholder="ลักษณะการจัดวางตัวหนังสือตอบกลับ..." 
                className="bg-slate-900 border-slate-700 text-white min-h-[50px] resize-none"
                value={format}
                onChange={(e) => setField('format', e.target.value)}
              />
            </div>

            {/* 6. Tone - โทนเสียงอารมณ์ */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="tone" className="text-indigo-300 font-semibold flex items-center gap-1">
                  <span className="text-slate-500 text-xs">6.</span> น้ำเสียงและสไตล์ (Tone)
                </Label>
                <span className="text-xs text-slate-500">(เช่น แบบเป็นทางการสุภาพ, เพื่อนสนิทแบบเป็นกันเอง)</span>
              </div>
              <Textarea 
                id="tone" 
                placeholder="ระบุสไตล์ของภาษาในการตอบกลับ..." 
                className="bg-slate-900 border-slate-700 text-white min-h-[50px] resize-none"
                value={tone}
                onChange={(e) => setField('tone', e.target.value)}
              />
            </div>

          </CardContent>
        </Card>
      </div>

      {/* ────────────────── แผงควบคุมฝั่งขวา: พรีวิวคำสั่งประกอบและ AI Sandbox ────────────────── */}
      <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
        
        {/* หน้าต่างพรีวิว Prompt ที่ประกอบร่างแล้ว */}
        <Card className="bg-slate-800 border-slate-700 text-white flex-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-700/50">
            <div>
              <CardTitle className="text-md">ผลลัพธ์คำสั่งที่ประกอบขึ้นมา</CardTitle>
              <CardDescription className="text-slate-400">ข้อความฉบับรวมสมบูรณ์พร้อมส่งต่อ</CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={handleCopyPrompt} 
              disabled={!compiledPrompt.trim()}
              className="bg-slate-900 hover:bg-slate-700 text-slate-300"
            >
              <Clipboard className="h-4 w-4 mr-1" />
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-4 bg-slate-900/40 font-mono text-sm leading-relaxed overflow-y-auto max-h-[300px] whitespace-pre-wrap">
            {compiledPrompt.trim() ? (
              <span className="text-slate-300">{compiledPrompt}</span>
            ) : (
              <span className="text-slate-500 italic">ข้อความจะประกบขึ้นโดยอัตโนมัติเมื่อผู้เรียนเริ่มกรอกกล่องข้อมูลทางด้านซ้าย...</span>
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto">
              {mounted ? (
                <>
                  <span>ประเมินด้วย:</span>
                  <Badge variant="outline" className="bg-slate-900 border-slate-700 text-indigo-300 font-semibold px-2 py-0.5">
                    {settings.provider === 'gemini' && 'Google Gemini'}
                    {settings.provider === 'openai' && 'OpenAI GPT'}
                    {settings.provider === 'anthropic' && 'Anthropic Claude'}
                    {settings.provider === 'deepseek' && 'DeepSeek AI'}
                  </Badge>
                  <span className="text-[10px] text-slate-500 font-mono">({settings.modelName})</span>
                </>
              ) : (
                <span>กำลังโหลดการตั้งค่า...</span>
              )}
            </div>
            <Button 
              onClick={handleSubmitPrompt} 
              disabled={isLoading || !task.trim()} 
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shrink-0"
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'กำลังประเมินและสตรีมคำตอบ...' : 'ทดสอบส่งให้ AI ตรวจคำสั่ง'}
            </Button>
          </CardFooter>
        </Card>

        {/* ช่องทางแสดงคำตอบ AI ของห้อง Sandbox */}
        <Card className="bg-slate-800 border-slate-700 text-white flex-1 flex flex-col min-h-[250px]">
          <CardHeader className="pb-2 border-b border-slate-700/50">
            <CardTitle className="text-md flex items-center justify-between">
              <span>ผลการวิเคราะห์และตรวจสอบจากระบบ AI</span>
              {aiResponse && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  <span>Interactive AI Sandbox</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto text-sm leading-relaxed bg-slate-900/60">
            {aiResponse ? (
              <div className="space-y-4">
                <div className="whitespace-pre-wrap text-slate-300">{aiResponse}</div>
                
                {/* แสดงสรุปผลผ่านเกณฑ์โดยการวิเคราะห์จากหลังบ้าน */}
                {currentChallengeId && !isLoading && (
                  <div className="pt-4 border-t border-slate-700/50 flex items-center gap-2">
                    {aiResponse.includes("ผ่าน") || aiResponse.includes("สำเร็จ") || aiResponse.toLowerCase().includes("passed") ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-md p-2 w-full text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>ผลตรวจสอบ: ยินดีด้วยครับ! คุณครูและระบบ AI ให้ผ่านภารกิจเกณฑ์การทดสอบนี้</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md p-2 w-full text-xs font-semibold">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                        <span>ผลตรวจสอบ: ปัจจุบันคำตอบยังไม่ตรงเงื่อนไขของเกณฑ์ประเมินภารกิจ ลองปรับปรุง Prompt ข้อที่ผิดแล้วส่งใหม่อีกครั้งนะครับ</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic gap-2 py-8">
                <Sparkles className="h-8 w-8 text-slate-600 animate-pulse" />
                <span>คำตอบและความเห็นของครู AI จะถูกพ่นออกมาแบบเรียลไทม์ที่นี่หลังจากกดปุ่มส่งทดสอบ...</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}