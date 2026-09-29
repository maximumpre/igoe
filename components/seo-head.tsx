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
 * 2. `<CrawlerSeoHead />` renders the same values as literal elements for the
 *    crawler branch.
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

/** Explicit head elements for the crawler branch. React 19 hoists these into <head>. */
export function CrawlerSeoHead() {
  return (
    <>
      <title>{SITE_TITLE}</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <meta name="keywords" content={SITE_KEYWORDS.join(",")} />
      <meta name="application-name" content={SITE_DISPLAY_NAME} />
      <meta name="author" content={SITE_DISPLAY_NAME} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
      <link rel="canonical" href={SITE_ORIGIN} />

      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={SITE_ORIGIN} />
      <meta property="og:site_name" content={SITE_DISPLAY_NAME} />
      <meta property="og:title" content={SITE_TITLE} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:width" content={String(OG_IMAGE.width)} />
      <meta property="og:image:height" content={String(OG_IMAGE.height)} />
      <meta property="og:image:alt" content={OG_IMAGE.alt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SITE_TITLE} />
      <meta name="twitter:description" content={SITE_DESCRIPTION} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />
    </>
  )
}
