import 'server-only'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// ประกาศตัวแปรเชื่อมต่อในโกลบอลสโคปเพื่อป้องกันการเรียกเปิด Connection ล้นฐานข้อมูลในระหว่างที่รันทดสอบเว็บ
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'], // แสดงคำสั่ง SQL ใน Terminal เพื่อช่วยอำนวยความสะดวกในการตรวจหาจุดผิดพลาดของแอปพลิเคชัน
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma