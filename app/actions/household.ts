'use server'

import { randomBytes, randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { household, householdMember, user } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

export async function createHousehold(name: string) {
  const userId = await getUserId()
  const householdId = randomUUID()
  await db.insert(household).values({ id: householdId, name: name.trim().slice(0, 80) || 'Nossa casa', inviteCode: randomBytes(4).toString('hex').toUpperCase(), createdBy: userId })
  await db.insert(householdMember).values({ id: randomUUID(), householdId, userId, role: 'owner' })
  revalidatePath('/')
  return householdId
}

export async function joinHousehold(code: string) {
  const userId = await getUserId()
  const found = await db.select().from(household).where(eq(household.inviteCode, code.trim().toUpperCase())).limit(1)
  if (!found[0]) throw new Error('Convite inválido ou expirado')
  await db.insert(householdMember).values({ id: randomUUID(), householdId: found[0].id, userId, role: 'member' }).onConflictDoNothing()
  revalidatePath('/')
  return found[0].id
}

export async function getMyHousehold() {
  const userId = await getUserId()
  const rows = await db.select({ household, role: householdMember.role }).from(householdMember).innerJoin(household, eq(household.id, householdMember.householdId)).where(eq(householdMember.userId, userId)).limit(1)
  return rows[0] ?? null
}

export async function updateHouseholdSettings(input: { profileName: string; householdName: string }) {
  const userId = await getUserId()
  const profileName = input.profileName.trim().slice(0, 80)
  const householdName = input.householdName.trim().slice(0, 80)
  if (!profileName || !householdName) throw new Error('Preencha os nomes antes de salvar')

  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  if (!membership[0]) throw new Error('Conta compartilhada não encontrada')

  await db.update(user).set({ name: profileName, updatedAt: new Date() }).where(eq(user.id, userId))
  await db.update(household).set({ name: householdName }).where(and(eq(household.id, membership[0].householdId), eq(household.createdBy, userId)))
  revalidatePath('/')
  return { profileName, householdName }
}

export async function getHouseholdMembership(householdId: string) {
  const userId = await getUserId()
  const member = await db.select().from(householdMember).where(and(eq(householdMember.householdId, householdId), eq(householdMember.userId, userId))).limit(1)
  return member[0] ?? null
}
