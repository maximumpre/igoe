export const SITE_DISPLAY_NAME = "Goigoe Wealthcare" as const

export const SITE_ORIGIN = "https://www.goigoewealthcare-portal.com" as const

export const SITE_URL = SITE_ORIGIN

export const SITE_HOMEPAGE_CANONICAL = `${SITE_ORIGIN}/` as const

export const SITE_CONTENT_UPDATED_AT = "2026-08-05T14:00:00.000Z" as const

export const SITE_SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml` as const

export const CANONICAL_HOST = new URL(SITE_ORIGIN).hostname

export const INDEXNOW_KEY = "0729b49c6ba04a60ac5d7bd21bbc5757" as const

export const DEFAULT_SITE_TITLE = "Goigoe Wealthcare Member Login" as const

export function canonicalUrlForPath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`
  if (path === "/") return SITE_HOMEPAGE_CANONICAL
  return `${SITE_ORIGIN}${path}`
}

export type SitePlatform = "alight" | "wealthcare" | "other"

export const SITE_PLATFORM: SitePlatform = "wealthcare"

export function detectSitePlatform(): SitePlatform {
  return SITE_PLATFORM
}

export function getTelegramVisitorSiteName(): string {
  return SITE_DISPLAY_NAME
}

export const SOCIAL_PREVIEW_IMAGE = "/og-image.png" as const

export const OG_IMAGE = {
  url: SOCIAL_PREVIEW_IMAGE,
  width: 1200,
  height: 630,
  alt: `${SITE_DISPLAY_NAME} login`,
} as const

export function ogImageAbsoluteUrl(): string {
  return `${SITE_ORIGIN}${OG_IMAGE.url}`
}
