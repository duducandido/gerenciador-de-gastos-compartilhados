'use server'

import { randomBytes, randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { household, householdMember, user, savingsGoal, payableBill, expense, settlement, recurringBill, activityLog } from '@/lib/db/schema'

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

export async function updateAppearance(input: { accentColor: string; theme: 'light' | 'dark' }) {
  const userId = await getUserId()
  if (!/^#[0-9a-fA-F]{6}$/.test(input.accentColor)) throw new Error('Escolha uma cor válida')
  await db.update(user).set({ accentColor: input.accentColor, theme: input.theme, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/')
  return input
}

export async function updateProfileAvatar(image: string | null) {
  const userId = await getUserId()
  if (image && image.length > 700_000) throw new Error('A foto precisa ter menos de 500 KB')
  await db.update(user).set({ image, updatedAt: new Date() }).where(eq(user.id, userId))
  revalidatePath('/')
  return { image }
}

export async function getActivityLog() {
  const userId = await getUserId()
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  if (!membership[0]) return []
  return db.select().from(activityLog).where(eq(activityLog.householdId, membership[0].householdId)).orderBy(activityLog.createdAt)
}

async function logActivity(userId: string, householdId: string, action: string, entityType: string, entityId: string, details: string) {
  await db.insert(activityLog).values({ id: randomUUID(), householdId, userId, action, entityType, entityId, details })
}

export async function getExpenses() {
  const userId = await getUserId()
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  if (!membership[0]) return []
  return db.select().from(expense).where(eq(expense.householdId, membership[0].householdId)).orderBy(expense.spentAt)
}

export async function createExpense(input: { title: string; category: string; amount: number; paidBy: string }) {
  const userId = await getUserId()
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  if (!membership[0]) throw new Error('Conta compartilhada não encontrada')
  const title = input.title.trim().slice(0, 100)
  const category = input.category.trim().slice(0, 40)
  const amount = Number(input.amount)
  if (!title || !category || !Number.isFinite(amount) || amount <= 0 || amount > 100000000) throw new Error('Confira os dados do gasto')
  const [created] = await db.insert(expense).values({ id: randomUUID(), householdId: membership[0].householdId, title, category, amount: amount.toFixed(2), createdBy: userId }).returning()
  await logActivity(userId, membership[0].householdId, 'created', 'expense', created.id, `Criou o gasto ${title}`)
  revalidatePath('/')
  return { ...created, amount: Number(created.amount), paidBy: input.paidBy }
}

export async function deleteExpense(id: string) {
  const userId = await getUserId()
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  if (!membership[0]) throw new Error('Conta compartilhada não encontrada')
  await db.delete(expense).where(and(eq(expense.id, id), eq(expense.householdId, membership[0].householdId)))
  revalidatePath('/')
  return id
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

export async function deleteSavingsGoal(id: number) {
  const userId = await getUserId()
  await db.delete(savingsGoal).where(and(eq(savingsGoal.id, id), eq(savingsGoal.userId, userId)))
  revalidatePath('/')
  return id
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

export async function deletePayableBill(id: number) {
  const userId = await getUserId()
  await db.delete(payableBill).where(and(eq(payableBill.id, id), eq(payableBill.userId, userId)))
  revalidatePath('/')
  return id
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

export async function createSettlement(input: { toUserId: string; amount: number; note?: string }) {
  const userId = await getUserId()
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  const amount = Number(input.amount)
  if (!membership[0] || !input.toUserId || input.toUserId === userId || !Number.isFinite(amount) || amount <= 0) throw new Error('Confira os dados do acerto')
  const [created] = await db.insert(settlement).values({ id: randomUUID(), householdId: membership[0].householdId, fromUserId: userId, toUserId: input.toUserId, amount: amount.toFixed(2), note: input.note?.trim().slice(0, 160) || null }).returning()
  revalidatePath('/')
  return created
}

export async function getSettlements() {
  const userId = await getUserId()
  const membership = await db.select({ householdId: householdMember.householdId }).from(householdMember).where(eq(householdMember.userId, userId)).limit(1)
  if (!membership[0]) return []
  return db.select().from(settlement).where(eq(settlement.householdId, membership[0].householdId)).orderBy(settlement.settledAt)
}

export async function createRecurringBill(input: { title: string; person: string; amount: number; dueDay: number }) {
  const userId = await getUserId()
  const title = input.title.trim().slice(0, 100)
  const person = input.person.trim().slice(0, 80)
  const amount = Number(input.amount)
  if (!title || !person || !Number.isFinite(amount) || amount <= 0 || input.dueDay < 1 || input.dueDay > 31) throw new Error('Confira os dados da conta recorrente')
  const [created] = await db.insert(recurringBill).values({ id: randomUUID(), userId, title, person, amount: amount.toFixed(2), dueDay: Math.floor(input.dueDay) }).returning()
  revalidatePath('/')
  return created
}

export async function getRecurringBills() {
  const userId = await getUserId()
  return db.select().from(recurringBill).where(eq(recurringBill.userId, userId)).orderBy(recurringBill.dueDay)
}

export async function toggleRecurringBill(id: string, active: boolean) {
  const userId = await getUserId()
  const [updated] = await db.update(recurringBill).set({ active }).where(and(eq(recurringBill.id, id), eq(recurringBill.userId, userId))).returning()
  revalidatePath('/')
  return updated
}

export async function getHouseholdMembership(householdId: string) {
  const userId = await getUserId()
  const member = await db.select().from(householdMember).where(and(eq(householdMember.householdId, householdId), eq(householdMember.userId, userId))).limit(1)
  return member[0] ?? null
}
