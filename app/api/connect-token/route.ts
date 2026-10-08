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
    const connectToken = await pluggy.createConnectToken(undefined, {
      clientUserId: session.user.id,
      avoidDuplicates: true,
    })

    return NextResponse.json({ accessToken: connectToken.accessToken })
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido'
    const responseBody = typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { body?: { message?: string } } }).response?.body?.message ?? ''
      : ''
    console.error('[v0] Falha ao criar token Pluggy:', details, responseBody)
    const errorMessage = responseBody === 'clientId must be a UUID'
      ? 'O PLUGGY_CLIENT_ID configurado não é válido. Use o Client ID UUID da mesma conta e ambiente da Pluggy.'
      : responseBody || details
    return NextResponse.json({ error: errorMessage }, { status: 502 })
  }
}
