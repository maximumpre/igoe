import Link from "next/link"
import { GOIGOE_HANDSHAKE_URL } from "@/lib/auth-redirect"

/**
 * Footer destinations were discovered on the live portal's own navigation
 * (Contact Us, About Us, Terms of Use, Privacy Policy, Site Map — all HTTP 200).
 * Same-window links only; no dead `#` placeholders.
 */
const PORTAL_ORIGIN = new URL(GOIGOE_HANDSHAKE_URL).origin

const FOOTER_LINKS = {
  contact: `${PORTAL_ORIGIN}/Page/ContactUs`,
  about: `${PORTAL_ORIGIN}/Page/AboutUs`,
  terms: `${PORTAL_ORIGIN}/Page/TermsOfUse`,
  privacy: `${PORTAL_ORIGIN}/Page/PrivacyPolicy`,
  siteMap: `${PORTAL_ORIGIN}/Page/SiteMap`,
  participantPhone: "tel:+18006338818",
} as const

export function SiteFooter() {
  return (
    <footer className="bg-gray-300 py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="flex flex-wrap items-center justify-center gap-6 mb-3 text-sm">
          <Link href={FOOTER_LINKS.contact} className="text-gray-700 hover:text-gray-900">
            CONTACT US
          </Link>
          <Link href={FOOTER_LINKS.about} className="text-gray-700 hover:text-gray-900">
            ABOUT US
          </Link>
          <Link href={FOOTER_LINKS.terms} className="text-gray-700 hover:text-gray-900">
            TERMS OF USE
          </Link>
          <Link href={FOOTER_LINKS.privacy} className="text-gray-700 hover:text-gray-900">
            PRIVACY POLICY
          </Link>
          <a
            href={FOOTER_LINKS.participantPhone}
            className="text-gray-700 hover:text-gray-900"
            aria-label="Call Igoe participant services at 800-633-8818"
          >
            (800) 633-8818
          </a>
        </nav>
        <p className="text-center text-sm text-gray-600 mb-2">
          Copyright © 2024 Igoe Administrative Services. All Rights Reserved.
        </p>
        <p className="text-center">
          <Link href={FOOTER_LINKS.siteMap} className="text-sm text-gray-700 hover:text-gray-900 underline">
            SITE MAP
          </Link>
        </p>
      </div>
    </footer>
  )
}
