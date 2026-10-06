import { NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pluggyItem, pluggyTransaction } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { itemId } = await request.json()
    if (typeof itemId !== 'string' || !itemId) return NextResponse.json({ error: 'Item Pluggy inválido' }, { status: 400 })

    const client = new PluggyClient({ clientId: process.env.PLUGGY_CLIENT_ID!, clientSecret: process.env.PLUGGY_CLIENT_SECRET! })
    const item = await client.fetchItem(itemId)
    const institution = item.connector?.name || 'Conta bancária'
    await db.insert(pluggyItem).values({ id: `${session.user.id}:${itemId}`, userId: session.user.id, itemId, institution, status: item.status || 'UPDATED', lastUpdatedAt: new Date() }).onConflictDoUpdate({ target: [pluggyItem.userId, pluggyItem.itemId], set: { institution, status: item.status || 'UPDATED', lastUpdatedAt: new Date() } })

    const accounts = await client.fetchAccounts(itemId)
    let saved = 0
    for (const account of accounts.results || []) {
      const transactions = await client.fetchAllTransactions(account.id, { dateFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10) })
      for (const transaction of transactions) {
        await db.insert(pluggyTransaction).values({ id: transaction.id, userId: session.user.id, itemId, accountId: account.id, description: transaction.description || 'Transação bancária', amount: String(transaction.amount || 0), date: new Date(transaction.date), category: transaction.category || null, type: transaction.type || null, raw: transaction }).onConflictDoUpdate({ target: [pluggyTransaction.userId, pluggyTransaction.id], set: { description: transaction.description || 'Transação bancária', amount: String(transaction.amount || 0), date: new Date(transaction.date), category: transaction.category || null, type: transaction.type || null, raw: transaction, updatedAt: new Date() } })
        saved += 1
      }
    }
    return NextResponse.json({ institution, itemId, transactions: saved })
  } catch (error) {
    console.error('[v0] Falha ao sincronizar Pluggy:', error)
    return NextResponse.json({ error: 'Não foi possível sincronizar os dados bancários.' }, { status: 502 })
  }
}
