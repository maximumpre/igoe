import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registration | Goigoe Wealthcare Portal',
  description: 'Register for your Goigoe Wealthcare Portal account. Choose your preferred verification method - email or text message - to get started with managing your healthcare benefits.',
  keywords: 'Goigoe Wealthcare Portal, registration, sign up, healthcare portal, benefits registration, account creation',
  openGraph: {
    title: 'Registration | Goigoe Wealthcare Portal',
    description: 'Register for your Goigoe Wealthcare Portal account. Choose your preferred verification method to get started.',
  },
  twitter: {
    title: 'Registration | Goigoe Wealthcare Portal',
    description: 'Register for your Goigoe Wealthcare Portal account.',
  },
}

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

