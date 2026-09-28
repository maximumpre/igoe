import { MetadataRoute } from "next"
import { SITE_CONTENT_UPDATED_AT, SITE_HOMEPAGE_CANONICAL } from "@/lib/site-url"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_HOMEPAGE_CANONICAL,
      lastModified: SITE_CONTENT_UPDATED_AT,
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
