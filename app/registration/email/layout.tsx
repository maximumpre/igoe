import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Verification | Goigoe Wealthcare Portal',
  description: 'Verify your email address to complete your Goigoe Wealthcare Portal registration. Secure email verification process for your healthcare benefits account.',
  keywords: 'Goigoe Wealthcare Portal, email verification, email confirmation, healthcare portal verification',
  openGraph: {
    title: 'Email Verification | Goigoe Wealthcare Portal',
    description: 'Verify your email address to complete your Goigoe Wealthcare Portal registration.',
  },
  twitter: {
    title: 'Email Verification | Goigoe Wealthcare Portal',
    description: 'Verify your email address to complete your registration.',
  },
}

export default function EmailVerificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

