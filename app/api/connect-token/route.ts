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
    const appUrl = process.env.BETTER_AUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
    const connectToken = await pluggy.createConnectToken(undefined, {
      clientUserId: session.user.id,
      avoidDuplicates: true,
      ...(appUrl ? { webhookUrl: `${appUrl}/api/webhooks/pluggy` } : {}),
    })

    return NextResponse.json({ accessToken: connectToken.accessToken })
  } catch (error) {
    console.error('[v0] Falha ao criar token Pluggy:', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a conexão bancária.' }, { status: 502 })
  }
}
