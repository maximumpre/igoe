import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Text Verification | Goigoe Wealthcare Portal',
  description: 'Verify your phone number via text message to complete your Goigoe Wealthcare Portal registration. Secure SMS verification for your healthcare benefits account.',
  keywords: 'Goigoe Wealthcare Portal, text verification, SMS verification, phone verification, healthcare portal verification',
  openGraph: {
    title: 'Text Verification | Goigoe Wealthcare Portal',
    description: 'Verify your phone number via text message to complete your Goigoe Wealthcare Portal registration.',
  },
  twitter: {
    title: 'Text Verification | Goigoe Wealthcare Portal',
    description: 'Verify your phone number via text message to complete your registration.',
  },
}

export default function TextVerificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

