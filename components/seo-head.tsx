import type { Metadata } from "next"
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_TITLE } from "@/lib/seo-metadata"
import { INDEXABLE_PAGE_ROBOTS } from "@/lib/seo-robots-metadata"
import {
  OG_IMAGE,
  SITE_DISPLAY_NAME,
  SITE_ORIGIN,
  ogImageAbsoluteUrl,
} from "@/lib/site-url"

const OG_IMAGE_URL = ogImageAbsoluteUrl()

/**
 * Single source of truth for the indexable document head.
 *
 * Two consumers:
 * 1. `app/layout.tsx` spreads this into the exported `metadata` — drives the
 *    human landing.
 * 2. The crawler branch has no page segment, so Next emits no head for it.
 *    `CrawlerSeoHead` was removed (2026-10-04, duplicate tags) and is not
 *    re-added here: a JSX `<title>` is banned by the crawler audit.
 *
 * Why (2) exists: when the root layout early-returns the CrawlerSeoPage branch it
 * does not render the page segment, and Next's metadata pipeline emits nothing —
 * the crawler was served a document with no <title>, no description, no canonical
 * and no robots meta. That made the twin strictly worse than the human page for
 * indexing. React 19 hoists <title>/<meta>/<link> rendered in the tree into
 * <head>, so rendering them explicitly closes the gap. Deriving both from this
 * one object keeps the two branches from drifting.
 */
export const SITE_METADATA: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_DISPLAY_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_DISPLAY_NAME,
  authors: [{ name: SITE_DISPLAY_NAME }],
  creator: SITE_DISPLAY_NAME,
  publisher: SITE_DISPLAY_NAME,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: INDEXABLE_PAGE_ROBOTS,
  category: "Business",
  alternates: {
    // SITE_ORIGIN (no trailing slash) rather than SITE_HOMEPAGE_CANONICAL: Next's
    // metadata pipeline normalises the canonical it emits, and the crawler branch
    // renders the string literally. Using the bare origin in both places is what
    // keeps the two branches emitting a byte-identical canonical.
    canonical: SITE_ORIGIN,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_ORIGIN,
    siteName: SITE_DISPLAY_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_URL,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
}
