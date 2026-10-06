'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pluggyItem, pluggyTransaction } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

export async function getPluggyItems() {
  const userId = await getUserId()
  return db.select().from(pluggyItem).where(eq(pluggyItem.userId, userId)).orderBy(desc(pluggyItem.createdAt))
}

export async function getPluggyTransactions() {
  const userId = await getUserId()
  return db.select().from(pluggyTransaction).where(eq(pluggyTransaction.userId, userId)).orderBy(desc(pluggyTransaction.date)).limit(100)
}

export async function savePluggyItem(input: { itemId: string; institution: string; status?: string }) {
  const userId = await getUserId()
  if (!input.itemId || !input.institution) throw new Error('Conexão bancária inválida')
  const [item] = await db.insert(pluggyItem).values({
    id: `${userId}:${input.itemId}`,
    userId,
    itemId: input.itemId,
    institution: input.institution.slice(0, 120),
    status: (input.status || 'UPDATED').slice(0, 40),
    lastUpdatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [pluggyItem.userId, pluggyItem.itemId],
    set: { institution: input.institution.slice(0, 120), status: (input.status || 'UPDATED').slice(0, 40), lastUpdatedAt: new Date() },
  }).returning()
  return item
}

export async function deletePluggyItem(itemId: string) {
  const userId = await getUserId()
  await db.delete(pluggyItem).where(and(eq(pluggyItem.userId, userId), eq(pluggyItem.itemId, itemId)))
}
