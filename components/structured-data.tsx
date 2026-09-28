import {
  CANONICAL_HOST,
  SITE_DISPLAY_NAME,
  SITE_HOMEPAGE_CANONICAL,
  SITE_ORIGIN,
} from "@/lib/site-url"
import { LAYOUT_DESCRIPTION } from "@/lib/meta-description"

const SCHEMA_ALTERNATE_NAMES = [
  "Sun Chemical Login",
  "Sun Chemical Alight Worklife",
  `${CANONICAL_HOST.toLowerCase()}`,
] as const

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_DISPLAY_NAME,
    alternateName: [...SCHEMA_ALTERNATE_NAMES],
    url: SITE_HOMEPAGE_CANONICAL,
    description: LAYOUT_DESCRIPTION,
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: SITE_DISPLAY_NAME,
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/og-image.png`,
    },
    potentialAction: {
      "@type": "LoginAction",
      target: {
        "@type": "EntryPoint",
        url: SITE_HOMEPAGE_CANONICAL,
      },
      name: `Sign in to ${SITE_DISPLAY_NAME}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
