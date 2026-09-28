import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const method = request.nextUrl.searchParams.get('method')
  const path =
    method === 'text' ? '/registration/text' : '/registration/email'

  const response = NextResponse.redirect(new URL(path, request.url), 302)
  response.cookies.set('registration_accessed', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 30,
    path: '/',
  })

  return response
}
