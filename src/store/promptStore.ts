import { create } from 'zustand'

// ออกแบบคุณสมบัติของข้อมูลและฟังก์ชันที่จำเป็นภายในคลังจัดเก็บข้อมูลกลาง
interface PromptState {
  // 6 องค์ประกอบพื้นฐานของ Prompt ตามบทเรียนสไลด์นำเสนอ
  task: string
  context: string
  examples: string
  persona: string
  format: string
  tone: string
  
  // รหัสโจทย์หรือภารกิจปัจจุบันที่นักเรียนกำลังทำอยู่
  currentChallengeId: string | null

  // ฟังก์ชันปรับปรุงข้อความแยกตามช่องกรอก
  setField: (
    field: 'task' | 'context' | 'examples' | 'persona' | 'format' | 'tone', 
    value: string
  ) => void
  
  // ฟังก์ชันสลับโจทย์ภารกิจ
  setChallengeId: (id: string | null) => void
  
  // ฟังก์ชันรีเซ็ตค่าเริ่มต้นสำหรับทำโจทย์ข้อใหม่
  resetFields: () => void
  
  // ฟังก์ชันรวมข้อความทั้ง 6 ช่องออกมาเป็น Prompt เดียวที่สมบูรณ์ตามลำดับความสำคัญ
  compilePrompt: () => string
}

export const usePromptStore = create<PromptState>((set, get) => ({
  task: '',
  context: '',
  examples: '',
  persona: '',
  format: '',
  tone: '',
  currentChallengeId: null,

  // อัปเดตค่าของฟิลด์ที่กำหนดโดยรักษาค่าเดิมในตัวแปรตัวอื่นๆ ไว้
  setField: (field, value) => set({ [field]: value }),

  // กำหนดโจทย์ที่ผู้ใช้งานกำลังทำ
  setChallengeId: (id) => set({ currentChallengeId: id }),

  // คืนค่าว่างทั้งหมดเมื่อกดเริ่มล้างข้อมูลใหม่
  resetFields: () => set({
    task: '',
    context: '',
    examples: '',
    persona: '',
    format: '',
    tone: '',
  }),

  // ฟังก์ชันนี้สำคัญมาก: รวมกลุ่มคำสั่งย่อยเรียงลำดับความสำคัญตามสไลด์ที่ 69 เพื่อผลลัพธ์ที่ดีที่สุดจาก AI
  compilePrompt: () => {
    const { task, context, examples, persona, format, tone } = get()
    const promptParts: string[] = []

    // 1. กำหนด Persona (บทบาทสมมุติ) เพื่อปรับทิศทางการคิดของโมเดลเป็นอันดับแรก
    if (persona) {
      promptParts.push(`[Persona / บทบาทสมมุติ]\nสวมบทบาทเป็น: ${persona}\n`)
    }

    // 2. กำหนดคำสั่งหลัก (Task / Instruction) ซึ่งเป็นส่วนสำคัญที่สุดที่ขาดไม่ได้
    if (task) {
      promptParts.push(`[Task / คำสั่งหลัก]\nงานที่ต้องทำคือ: ${task}\n`)
    }

    // 3. ป้อนบริบทแวดล้อมเพื่อตีกรอบความต้องการ (Context)
    if (context) {
      promptParts.push(`[Context / ข้อมูลบริบทและเงื่อนไขเพิ่มเติม]\nข้อมูลที่ต้องรู้: ${context}\n`)
    }

    // 4. ให้ตัวอย่างรูปแบบคำตอบที่ถูกต้องเพื่อลดการมโนของโมเดล (Examples)
    if (examples) {
      promptParts.push(`[Examples / ตัวอย่างคำตอบ]\nรูปแบบตัวอย่างการเขียนส่งข้อความคืนมา:\n${examples}\n`)
    }

    // 5. ระบุข้อตกลงในการจัดวางหน้าตาข้อมูล (Format / Style)
    if (format) {
      promptParts.push(`[Format & Style / รูปแบบการจัดวางผลลัพธ์]\nนำเสนอข้อมูลกลับคืนมาในรูปแบบ: ${format}\n`)
    }

    // 6. เสริมอารมณ์และโทนในการสื่อสาร (Tone)
    if (tone) {
      promptParts.push(`[Tone / อารมณ์ในการสนทนา]\nเขียนตอบด้วยน้ำเสียงหรือบรรยากาศ: ${tone}\n`)
    }

    return promptParts.join('\n').trim()
  }
}))