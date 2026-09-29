import { siteJsonLd } from "@/components/structured-data"

/**
 * Rendered by app/layout.tsx in both the human and crawler branches.
 * The schema itself lives in components/structured-data.tsx so there is exactly
 * one definition — wiring a second component here would emit duplicate JSON-LD
 * for the same WebSite/Organization entities.
 */
export function SeoJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
    />
  )
}
