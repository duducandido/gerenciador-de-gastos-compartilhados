import { NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const clientId = process.env.PLUGGY_CLIENT_ID
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Credenciais da Pluggy não configuradas.' }, { status: 503 })
    }

    const pluggy = new PluggyClient({ clientId, clientSecret })
    const connectToken = await pluggy.createConnectToken(null as unknown as undefined, {
      clientUserId: session.user.id,
      avoidDuplicates: true,
    })

    return NextResponse.json({ accessToken: connectToken.accessToken })
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido'
    const responseBody = typeof error === 'object' && error !== null && 'response' in error
      ? String((error as { response?: { body?: unknown } }).response?.body ?? '')
      : ''
    console.error('[v0] Falha ao criar token Pluggy:', details, responseBody)
    return NextResponse.json({ error: 'Não foi possível iniciar a conexão bancária.', details: responseBody || details }, { status: 502 })
  }
}
