import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expense, expenseAttachment, householdMember } from '@/lib/db/schema'

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo inválido. Use JPG, PNG, WEBP ou PDF de até 8 MB.' }, { status: 400 })
  }
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).innerJoin(expense, eq(expense.householdId, householdMember.householdId)).where(and(eq(expense.id, id), eq(householdMember.userId, session.user.id))).limit(1)
  if (!membership[0]) return NextResponse.json({ error: 'Gasto não encontrado' }, { status: 404 })
  const blob = await put(`receipts/${membership[0].householdId}/${id}/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`, file, { access: 'private', addRandomSuffix: false })
  const [attachment] = await db.insert(expenseAttachment).values({ id: randomUUID(), expenseId: id, householdId: membership[0].householdId, userId: session.user.id, pathname: blob.pathname, filename: file.name.slice(0, 180), contentType: file.type, size: file.size }).returning()
  return NextResponse.json({ id: attachment.id, filename: attachment.filename })
}
