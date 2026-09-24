'use server'

import { randomBytes, randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { household, householdMember, user, savingsGoal, payableBill } from '@/lib/db/schema'

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

export async function updateProfileAvatar(image: string | null) {
  const userId = await getUserId()
  if (image && image.length > 700_000) throw new Error('A foto precisa ter menos de 500 KB')
  await db.update(user).set({ image, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/')
  return { image }
}

export async function getSavingsGoals() {
  const userId = await getUserId()
  return db.select().from(savingsGoal).where(eq(savingsGoal.userId, userId)).orderBy(savingsGoal.createdAt)
}

export async function createSavingsGoal(input: { name: string; targetAmount: number; installmentAmount: number; dueDay: number }) {
  const userId = await getUserId()
  const name = input.name.trim().slice(0, 80)
  if (!name || input.targetAmount <= 0 || input.installmentAmount <= 0 || input.dueDay < 1 || input.dueDay > 31) throw new Error('Confira os dados da reserva')
  const [created] = await db.insert(savingsGoal).values({ userId, name, targetAmount: Math.round(input.targetAmount * 100), installmentAmount: Math.round(input.installmentAmount * 100), dueDay: input.dueDay }).returning()
  revalidatePath('/')
  return created
}

export async function contributeToSavingsGoal(id: number, amount: number) {
  const userId = await getUserId()
  if (amount <= 0) throw new Error('Valor inválido')
  const [current] = await db.select().from(savingsGoal).where(and(eq(savingsGoal.id, id), eq(savingsGoal.userId, userId))).limit(1)
  if (!current) throw new Error('Reserva não encontrada')
  const [updated] = await db.update(savingsGoal).set({ savedAmount: current.savedAmount + Math.round(amount * 100) }).where(and(eq(savingsGoal.id, id), eq(savingsGoal.userId, userId))).returning()
  revalidatePath('/')
  return updated
}

export async function getPayableBills() {
  const userId = await getUserId()
  return db.select().from(payableBill).where(eq(payableBill.userId, userId)).orderBy(payableBill.dueDay)
}

export async function createPayableBill(input: { person: string; title: string; totalAmount: number; installmentAmount: number; totalInstallments: number; dueDay: number }) {
  const userId = await getUserId()
  const person = input.person.trim().slice(0, 80)
  const title = input.title.trim().slice(0, 100)
  if (!person || !title || input.totalAmount <= 0 || input.installmentAmount <= 0 || input.totalInstallments < 1 || input.dueDay < 1 || input.dueDay > 31) throw new Error('Confira os dados da conta')
  const [created] = await db.insert(payableBill).values({ userId, person, title, totalAmount: Math.round(input.totalAmount * 100), installmentAmount: Math.round(input.installmentAmount * 100), totalInstallments: Math.floor(input.totalInstallments), dueDay: Math.floor(input.dueDay) }).returning()
  revalidatePath('/')
  return created
}

export async function payNextInstallment(id: number) {
  const userId = await getUserId()
  const [bill] = await db.select().from(payableBill).where(and(eq(payableBill.id, id), eq(payableBill.userId, userId))).limit(1)
  if (!bill) throw new Error('Conta não encontrada')
  const paidInstallments = Math.min(bill.totalInstallments, bill.paidInstallments + 1)
  const [updated] = await db.update(payableBill).set({ paidInstallments, status: paidInstallments >= bill.totalInstallments ? 'paid' : 'pending' }).where(and(eq(payableBill.id, id), eq(payableBill.userId, userId))).returning()
  revalidatePath('/')
  return updated
}

export async function getHouseholdMembership(householdId: string) {
  const userId = await getUserId()
  const member = await db.select().from(householdMember).where(and(eq(householdMember.householdId, householdId), eq(householdMember.userId, userId))).limit(1)
  return member[0] ?? null
}
