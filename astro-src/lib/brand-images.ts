/**
 * Resolved image URLs for the Astro pages.
 *
 * CRITICAL: When importing assets via Vite/Astro, imported images return an
 * ImageMetadata OBJECT ({ src, width, height, format }), not a URL string.
 * Interpolating the object directly renders `src="[object Object]"` in <img>.
 *
 * This module exports safe URL strings for public/ assets.
 */

export const toImageUrl = (asset: string | { src: string }): string =>
  typeof asset === "string" ? asset : encodeURI(asset.src)

/** Goigoe / Igoe brand mark — same path as app/page.tsx and CrawlerSeoPage. */
export const BRAND_LOGO_SRC = "/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
/** Hero preload for human landing — same brand mark (no separate hero asset). */
export const HERO_IMAGE_SRC = "/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
export const PARTNER_LOGO_SRC = "/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
