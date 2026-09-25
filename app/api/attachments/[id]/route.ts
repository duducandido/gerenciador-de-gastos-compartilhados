import { get } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenseAttachment, householdMember } from '@/lib/db/schema'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const rows = await db.select({ attachment: expenseAttachment }).from(expenseAttachment).innerJoin(householdMember, and(eq(householdMember.householdId, expenseAttachment.householdId), eq(householdMember.userId, session.user.id))).where(eq(expenseAttachment.id, id)).limit(1)
  if (!rows[0]) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  const result = await get(rows[0].attachment.pathname, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') ?? undefined })
  if (!result) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
  return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, ETag: result.blob.etag, 'Cache-Control': 'private, no-cache', 'Content-Disposition': `inline; filename="${rows[0].attachment.filename.replace(/"/g, '')}"` } })
}
