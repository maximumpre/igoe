import { LAYOUT_DESCRIPTION } from "@/lib/meta-description"
import { buildSiteKeywords } from "@/lib/seo-keywords"
import { DEFAULT_SITE_TITLE } from "@/lib/site-url"

export const SITE_TITLE = DEFAULT_SITE_TITLE

export const SITE_DESCRIPTION = LAYOUT_DESCRIPTION

export const SITE_KEYWORDS: string[] = buildSiteKeywords()
