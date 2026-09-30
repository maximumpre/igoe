import { NextRequest, NextResponse } from "next/server"
import { sendResendCodeNotification } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { page?: string; userId?: string }
    const page = typeof body.page === "string" ? body.page : undefined
    const userId = typeof body.userId === "string" ? body.userId : undefined
    const telegramSuccess = await sendResendCodeNotification({ page, userId })
    return NextResponse.json({ success: true, telegramSent: telegramSuccess })
  } catch (error) {
    console.error("Failed to send resend code notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
