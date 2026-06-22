import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL as string)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 เริ่มทำการบันทึกข้อมูลโจทย์และภารกิจเริ่มต้น เข้าสู่ระบบ...')

  // ลบข้อมูลโจทย์เก่าทิ้งทั้งหมดก่อนทำการรีเซ็ตข้อมูล (ป้องกันการเขียนทับซ้ำสอง)
  await prisma.progress.deleteMany()
  await prisma.prompt.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.user.deleteMany()

  // 1. สร้างบัญชีผู้ใช้จำลองขึ้นมา 1 บัญชี สำหรับจำลองการเข้าใช้งานของนักเรียน
  const student = await prisma.user.create({
    data: {
      username: 'student_tester',
      passwordHash: 'no_password_needed_for_now',
      role: 'STUDENT',
    },
  })

  // 2. ข้อมูลโจทย์ภารกิจทดสอบ (Challenges) 3 ระดับ
  const challenge1 = await prisma.challenge.create({
    data: {
      title: 'ภารกิจที่ 1: ตารางโภชนาการสำหรับผู้ป่วยเบาหวาน (ระดับง่าย)',
      difficulty: 'EASY',
      description: 'ให้นักเรียนออกแบบ Prompt เพื่อสั่งให้ AI คิดตารางเมนูอาหารเย็นสำหรับผู้ป่วยเบาหวาน โดยมีเงื่อนไขดังนี้:\n1. ใช้วัตถุดิบราคาประหยัด\n2. แสดงผลลัพธ์เป็นรูปแบบ "ตาราง" (Table) เพื่อให้อ่านเข้าใจง่าย',
      expectedFormat: 'TABLE',
      systemPrompt: 'คุณคือผู้ช่วยตรวจสอบ Prompt ให้ตรวจจับว่า Prompt นี้มีการสั่งงานให้ออกแบบตารางอาหารเย็นสำหรับคนเป็นเบาหวาน และผลลัพธ์ต้องแสดงในลักษณะของตาราง Markdown เท่านั้น หากตรงตามกฎให้สรุปบอกว่าผู้เรียนผ่านภารกิจด้วยคำว่า "ผ่านภารกิจการสร้างตารางอาหารแล้ว"',
    },
  })

  const challenge2 = await prisma.challenge.create({
    data: {
      title: 'ภารกิจที่ 2: สรุปบทความประวัติศาสตร์ไทยฉบับเด็กนักเรียน (ระดับปานกลาง)',
      difficulty: 'MEDIUM',
      description: 'ให้นักเรียนออกแบบ Prompt เพื่อสรุปเรื่องราวประวัติศาสตร์สุโขทัย โดยกำหนดข้อห้ามดังนี้:\n1. ความยาวข้อความสรุปห้ามเกิน 3 บรรทัด\n2. ต้องปรับภาษาอารมณ์ (Tone) ให้อบอุ่น เข้าใจง่าย เหมาะสมสำหรับเด็กนักเรียนอายุ 8-10 ขวบอ่านเข้าใจง่าย',
      expectedFormat: 'PARAGRAPH',
      systemPrompt: 'ให้ตรวจสอบว่าคำตอบสุดท้ายเป็นบทสรุปประวัติศาสตร์สุโขทัยที่มีความยาวกระชับและภาษาที่อบอุ่นเหมาะกับเด็กอายุ 8-10 ขวบหรือไม่ หากเหมาะสมให้สรุปบอกผู้เรียนว่า "ผ่านภารกิจย่อความภาษาอบอุ่นเรียบร้อยแล้ว"',
    },
  })

  const challenge3 = await prisma.challenge.create({
    data: {
      title: 'ภารกิจที่ 3: สวมบทบาทโปรแกรมเมอร์สอนเขียนโค้ด (ระดับสูง)',
      difficulty: 'HARD',
      description: 'ให้นักเรียนออกแบบ Prompt เพื่อจำลองตัวละครแชทบอทให้ทำตัวเป็น "โปรแกรมเมอร์ผู้เชี่ยวชาญที่มีประสบการณ์สอนกว่า 10 ปี" เพื่อสอนการทำงานเกี่ยวกับหลักการเขียน API อย่างง่าย โดยคำตอบที่ AI ส่งกลับมาต้องเน้นการอธิบายทีละลำดับขั้นตอน (Chain of Thought)',
      expectedFormat: 'LIST',
      systemPrompt: 'ตรวจสอบว่ามีการใช้แนวคิดสวมบทบาท (Persona) เป็นโปรแกรมเมอร์ผู้มีประสบการณ์ และคำตอบมีการสอนเขียนอธิบายอย่างละเอียดเป็นขั้นเป็นตอนหรือไม่ หากใช่ให้สรุปแจ้งนักเรียนว่า "ผ่านภารกิจนักออกแบบ Prompt ระดับสูงแล้ว"',
    },
  })

  console.log('✅ บันทึกข้อมูลโจทย์สำเร็จเรียบร้อยแล้ว!')
  console.log(`👤 บัญชีผู้เรียนจำลอง: ${student.username}`)
  console.log(`📋 โจทย์ที่พร้อมใช้งาน: 3 โจทย์`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ เกิดข้อผิดพลาดในขณะทำการเตรียมข้อมูล:')
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })