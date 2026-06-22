import { prisma } from '@/lib/prisma'
import { PromptCraftSandbox } from '@/components/PromptCraftSandbox'

// กำหนดให้หน้าจอนี้ดึงข้อมูลแบบไดนามิกตลอดเวลา (ไม่ทำแคช เพื่อให้ผลคะแนนอัปเดตเรียลไทม์)
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 1. ดึงรายชื่อโจทย์ภารกิจทั้งหมดจากฐานข้อมูล Postgres เรียงตามลำดับความยากง่าย
  const challenges = await prisma.challenge.findMany({
    orderBy: {
      difficulty: 'asc'
    }
  })

  // 2. ค้นหายูสเซอร์ตัวทดสอบที่เราเตรียมข้อมูลจำลอง (Seed) ไว้ เพื่อเป็นตัวแทนในการส่งคะแนนสอบ
  let mockUser = await prisma.user.findFirst({
    where: { username: 'student_tester' }
  })

  // หากกรณีไม่มีข้อมูลผู้ใช้ในระบบหลังบ้าน ให้สร้างบัญชีเตรียมพร้อมให้ทันที
  if (!mockUser) {
    mockUser = await prisma.user.create({
      data: {
        username: 'student_tester',
        passwordHash: 'no_password_needed_for_now',
        role: 'STUDENT'
      }
    })
  }

  // 3. ส่งต่อข้อมูลจาก Postgres Server ไปให้คอมโพเนนต์ PromptCraftSandbox ฝั่ง Client ทำงานต่อ
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* หัวเว็บ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              PromptCraft Sandbox
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              ห้องเรียนรู้และทดสอบการออกแบบคำสั่ง (Prompt Engineering) ด้วย AI ประเมินผลสด
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-slate-300 font-medium">บัญชีนักเรียนทดสอบ: {mockUser.username}</p>
              <p className="text-xs text-slate-500">ID: {mockUser.id}</p>
            </div>
          </div>
        </div>

        {/* ตัวพื้นที่ Sandbox หลัก */}
        <PromptCraftSandbox 
          challenges={challenges} 
          userId={mockUser.id} 
        />
      </div>
    </main>
  )
}