import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: { canonical: null },
  robots: { index: false, follow: false },
}

export default function TwoFactorVerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
