import { cookies, headers } from "next/headers"
import type { Metadata } from "next"
import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import CrawlerSeoPage from "@/components/CrawlerSeoPage"
import { isCrawlerSeoPageUA } from "@/lib/bot-detection"
import { isCrawlerSeoPreviewUnlocked } from "@/lib/crawler-seo-preview"
import { isSeoCrawlerPath } from "@/lib/seo-crawler-paths"
import ProtectedLayout from "@/components/protected-layout"
import { SeoJsonLd } from "@/components/seo-json-ld"
import { CrawlerSeoHead, SITE_METADATA } from "@/components/seo-head"
import { BRAND_THEME_COLOR } from "@/lib/brand-config"
import {
  SITE_DISPLAY_NAME,
  SITE_HOMEPAGE_CANONICAL,
} from "@/lib/site-url"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  ...SITE_METADATA,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      {
        url: "/cropped-Favicon-Preferred-Blue-ig-1-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  other: {
    "msapplication-TileImage": "/icon-48x48.png",
  },
  themeColor: BRAND_THEME_COLOR,
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const cookieStore = await cookies()
  const pathname = headersList.get("x-pathname") || "/"
  const ua = headersList.get("user-agent")
  const isCrawlerSeo =
    isCrawlerSeoPreviewUnlocked() ||
    headersList.get("x-crawler-seo-page") === "1" ||
    cookieStore.get("x-crawler-seo-page")?.value === "1" ||
    (isCrawlerSeoPageUA(ua) && isSeoCrawlerPath(pathname))

  if (isCrawlerSeo) {
    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="font-sans antialiased">
          <CrawlerSeoHead />
          <SeoJsonLd />
          <CrawlerSeoPage />
          <Analytics />
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <SeoJsonLd />
        <ProtectedLayout>{children}</ProtectedLayout>
        <Analytics />
      </body>
    </html>
  )
}
