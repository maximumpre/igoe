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
 * - `alternateName` must NOT contain a raw domain, hostname or URL. Google Search
 *   Central: putting the domain in `alternateName` degrades the SERP site name to
 *   the raw URL. Only real human-facing brand spellings belong here.
 * - Descriptions must not read "sign in at <domain>".
 */

/**
 * Brand spellings observed on the live portal's own markup: the page title suffix
 * is "Igoe Administrative Services" on all 13 pages, and the About copy shortens it
 * to "Igoe". Both are legitimate aliases; the hostname is not.
 */
const SCHEMA_ALTERNATE_NAMES = [
  OPEN_GRAPH_TITLE,
  SITE_TITLE,
  BRAND_FULL_SITE_NAME,
  `${BRAND_FULL_SITE_NAME} login`,
  "Igoe Administrative Services",
  "Igoe",
] as const

const LOGO_URL = ogImageAbsoluteUrl()

/** Entity facts published on the live portal's About Us / Contact Us pages. */
const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_DISPLAY_NAME,
  alternateName: [...SCHEMA_ALTERNATE_NAMES],
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
  alternateName: [...SCHEMA_ALTERNATE_NAMES],
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
