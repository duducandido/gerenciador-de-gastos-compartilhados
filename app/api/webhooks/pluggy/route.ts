import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const event = await request.json()

    console.log("[v0] Evento recebido do Pluggy:", event.event, event.eventId)

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/pluggy",
    message: "Webhook Pluggy disponível. Use POST para enviar eventos.",
  })
}
