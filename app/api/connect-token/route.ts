import { NextResponse } from 'next/server'
import { PluggyClient } from 'pluggy-sdk'

export async function POST(request: Request) {
  try {
    const { clientUserId } = await request.json().catch(() => ({}))
    const clientId = process.env.PLUGGY_CLIENT_ID
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Credenciais da Pluggy não configuradas.' }, { status: 503 })
    }

    const pluggy = new PluggyClient({ clientId, clientSecret })
    const connectToken = await pluggy.createConnectToken({
      clientUserId: typeof clientUserId === 'string' ? clientUserId.slice(0, 120) : undefined,
    })

    return NextResponse.json({ accessToken: connectToken.accessToken })
  } catch (error) {
    console.error('[v0] Falha ao criar token Pluggy:', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a conexão bancária.' }, { status: 502 })
  }
}
