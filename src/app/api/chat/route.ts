import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { promptText, challengeId, userId, provider = 'gemini', apiKey, modelName } = await req.json()

    if (!promptText) {
      return new Response('ไม่พบชุดคำสั่งที่คุณต้องการทดสอบกับ AI', { status: 400 })
    }

    // 1. ตั้งค่ามาตรฐานสำหรับตรวจประเมินข้อความ หากไม่มีรหัสโจทย์ระบบจะใช้โปรโตคอลตรวจสอบทั่วไป
    let systemInstruction = "คุณคือแชทบอทวิเคราะห์พรีวิวที่คอยแนะนำการเขียนคำสั่ง (Prompt Engineering) ให้คำอธิบายอย่างสุภาพเป็นมิตร"
    
    // 2. หากผู้ใช้งานกำลังส่งภารกิจ ให้ดึงเงื่อนไขตรวจสอบ (System Prompt) ของโจทย์ข้อนั้นๆ ออกมา
    if (challengeId) {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId }
      })
      if (challenge) {
        systemInstruction = challenge.systemPrompt
      }
    }

    const encoder = new TextEncoder()

    // 3. จัดการกรณีตาม Provider
    if (provider === 'gemini') {
      const geminiKey = apiKey || process.env.GEMINI_API_KEY
      if (!geminiKey || geminiKey === "ใส่คีย์_GEMINI_API_KEY_ของคุณที่นี่") {
        return new Response('กรุณาตั้งค่ารหัสผ่านการสื่อสารโมเดล GEMINI_API_KEY ในระบบหลังบ้าน หรือตั้งค่าในหน้า settings ก่อน', { status: 400 })
      }

      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({
        model: modelName || 'gemini-2.5-flash',
        systemInstruction: systemInstruction,
      })

      const result = await model.generateContentStream(promptText)

      const stream = new ReadableStream({
        async start(controller) {
          let aiFullResponse = ""
          try {
            for await (const chunk of result.stream) {
              const chunkText = chunk.text()
              aiFullResponse += chunkText
              controller.enqueue(encoder.encode(chunkText))
            }

            // บันทึกความสำเร็จลงฐานข้อมูล
            await saveProgress(userId, challengeId, promptText, aiFullResponse)
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })

    } else if (provider === 'openai' || provider === 'deepseek') {
      if (!apiKey) {
        return new Response(`กรุณากรอก API Key สำหรับ ${provider === 'openai' ? 'OpenAI' : 'DeepSeek'} ในหน้าตั้งค่าก่อนใช้งาน`, { status: 400 })
      }

      const url = provider === 'openai' 
        ? 'https://api.openai.com/v1/chat/completions' 
        : 'https://api.deepseek.com/chat/completions'

      const defaultModel = provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat'

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName || defaultModel,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptText }
          ],
          stream: true
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        return new Response(`AI API Error (${provider}): ${errText}`, { status: response.status })
      }

      const reader = response.body?.getReader()
      if (!reader) {
        return new Response('ไม่สามารถเชื่อมโยงช่องทางสตรีมข้อมูลจาก API ได้', { status: 500 })
      }

      const stream = new ReadableStream({
        async start(controller) {
          let aiFullResponse = ""
          const decoder = new TextDecoder()
          let buffer = ""

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ""

              for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue
                if (trimmed === 'data: [DONE]') continue
                if (trimmed.startsWith('data: ')) {
                  try {
                    const json = JSON.parse(trimmed.slice(6))
                    const content = json.choices?.[0]?.delta?.content || ''
                    if (content) {
                      aiFullResponse += content
                      controller.enqueue(encoder.encode(content))
                    }
                  } catch (e) {
                    console.error('Error parsing JSON line:', trimmed, e)
                  }
                }
              }
            }

            // จัดการข้อมูลตกค้างใน Buffer
            if (buffer && buffer.startsWith('data: ') && !buffer.includes('[DONE]')) {
              try {
                const json = JSON.parse(buffer.slice(6))
                const content = json.choices?.[0]?.delta?.content || ''
                if (content) {
                  aiFullResponse += content
                  controller.enqueue(encoder.encode(content))
                }
              } catch (e) {}
            }

            await saveProgress(userId, challengeId, promptText, aiFullResponse)
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })

    } else if (provider === 'anthropic') {
      if (!apiKey) {
        return new Response('กรุณากรอก API Key สำหรับ Anthropic ในหน้าตั้งค่าก่อนใช้งาน', { status: 400 })
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: modelName || 'claude-3-5-haiku-latest',
          system: systemInstruction,
          messages: [
            { role: 'user', content: promptText }
          ],
          max_tokens: 4000,
          stream: true
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        return new Response(`Anthropic API Error: ${errText}`, { status: response.status })
      }

      const reader = response.body?.getReader()
      if (!reader) {
        return new Response('ไม่สามารถเชื่อมโยงช่องทางสตรีมข้อมูลจาก API ได้', { status: 500 })
      }

      const stream = new ReadableStream({
        async start(controller) {
          let aiFullResponse = ""
          const decoder = new TextDecoder()
          let buffer = ""

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ""

              for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue
                
                // รูปแบบสตรีมมิ่งของ Anthropic
                if (trimmed.startsWith('data: ')) {
                  try {
                    const json = JSON.parse(trimmed.slice(6))
                    if (json.type === 'content_block_delta') {
                      const text = json.delta?.text || ''
                      if (text) {
                        aiFullResponse += text
                        controller.enqueue(encoder.encode(text))
                      }
                    }
                  } catch (e) {
                    console.error('Error parsing Anthropic JSON line:', trimmed, e)
                  }
                }
              }
            }

            await saveProgress(userId, challengeId, promptText, aiFullResponse)
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    } else {
      return new Response('ไม่พบโมเดลผู้ให้บริการที่ต้องการในระบบหลังบ้าน', { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in Chat API Route:', error)
    return new Response(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน', {
      status: 500
    })
  }
}

// ฟังก์ชันช่วยบันทึก Progress ความคืบหน้าของบทเรียนลง Postgres DB
async function saveProgress(userId: string | undefined, challengeId: string | undefined, promptText: string, aiFullResponse: string) {
  if (challengeId && userId) {
    const isPassed = 
      aiFullResponse.includes("ผ่าน") || 
      aiFullResponse.includes("สำเร็จ") || 
      aiFullResponse.toLowerCase().includes("passed")

    await prisma.progress.create({
      data: {
        userId: userId,
        challengeId: challengeId,
        status: isPassed ? "PASSED" : "FAILED",
        submittedPrompt: promptText,
        aiResponse: aiFullResponse,
      }
    })
  }
}