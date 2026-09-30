import { BRAND_FULL_SITE_NAME, OPEN_GRAPH_TITLE } from "@/lib/brand-config"
import { LAYOUT_DESCRIPTION } from "@/lib/meta-description"
import { SITE_TITLE } from "@/lib/seo-metadata"
import {
  SITE_DISPLAY_NAME,
  SITE_HOMEPAGE_CANONICAL,
  SITE_ORIGIN,
  ogImageAbsoluteUrl,
} from "@/lib/site-url"

/**
 * Single source of truth for the site's JSON-LD.
 *
 * Anti-degradation rules (see Steins Gate `SEO_SITE_NAMES.md`):
 * - `name` must strictly equal SITE_DISPLAY_NAME.
 * - `alternateName` lists real human-facing brand spellings first; the bare
 *   lowercase host is appended LAST as Google's documented fallback when it
 *   cannot map the brand to a site name.
 * - Descriptions must not read "sign in at <domain>".
 */

/**
 * Brand spellings observed on the live portal's own markup: the page title suffix
 * is "Igoe Administrative Services" on all 13 pages, and the About copy shortens it
 * to "Igoe". Both are legitimate aliases; the bare host is appended separately at the
 * schema level as Google's documented fallback.
 */
const SCHEMA_ALTERNATE_NAMES = [
  OPEN_GRAPH_TITLE,
  SITE_TITLE,
  BRAND_FULL_SITE_NAME,
  `${BRAND_FULL_SITE_NAME} login`,
  "Igoe Administrative Services",
  "Igoe",
] as const

const CANONICAL_HOST_FALLBACK = new URL(SITE_ORIGIN).hostname.toLowerCase()

const LOGO_URL = ogImageAbsoluteUrl()

/** Entity facts published on the live portal's About Us / Contact Us pages. */
const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_DISPLAY_NAME,
  alternateName: [...new Set([...SCHEMA_ALTERNATE_NAMES, CANONICAL_HOST_FALLBACK])],
  url: SITE_ORIGIN,
  logo: LOGO_URL,
  description: LAYOUT_DESCRIPTION,
  foundingDate: "1977",
  foundingLocation: {
    "@type": "Place",
    name: "San Diego, California",
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  knowsAbout: [
    "Health Savings Account",
    "Flexible Spending Account",
    "COBRA administration",
    "Flexible Benefit Plan administration",
    "Employee benefits administration",
  ],
} as const

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_DISPLAY_NAME,
  alternateName: [...new Set([...SCHEMA_ALTERNATE_NAMES, CANONICAL_HOST_FALLBACK])],
  description: LAYOUT_DESCRIPTION,
  url: SITE_HOMEPAGE_CANONICAL,
  publisher: ORGANIZATION_SCHEMA,
  inLanguage: "en-US",
  potentialAction: {
    "@type": "LoginAction",
    target: {
      "@type": "EntryPoint",
      url: SITE_HOMEPAGE_CANONICAL,
    },
    name: `Sign in to ${SITE_DISPLAY_NAME}`,
  },
} as const

export function siteJsonLd(): unknown[] {
  return [WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]
}

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
    />
  )
}
