import { NextResponse } from "next/server"

export async function POST(request: Request) {
  let event: Record<string, unknown> = {}

  try {
    const body = await request.text()
    if (body.trim()) {
      event = JSON.parse(body) as Record<string, unknown>
    }
  } catch {
    // O endpoint deve confirmar o recebimento mesmo quando o teste não envia JSON.
  }

  console.log("[v0] Evento recebido do Pluggy:", event.event, event.eventId)

  return NextResponse.json({ received: true }, { status: 200 })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/pluggy",
    message: "Webhook Pluggy disponível. Use POST para enviar eventos.",
  })
}
