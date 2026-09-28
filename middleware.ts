import { NextResponse } from "next/server"
import type { NextFetchEvent, NextRequest } from "next/server"
import { isDeniedBotUserAgent } from "@/lib/bot-verification/denied-bots"
import { buildErrorScreenHtml } from "@/lib/error-screen-html"
import {
  isAppleCrawlerUA,
  isBaiduCrawlerUA,
  isBingCrawlerUA,
  isCrawlerSeoPageUA,
  isDuckDuckCrawlerUA,
  isGoogleCrawlerUA,
  isSearchCrawlerUA,
  isYahooCrawlerUA,
} from "@/lib/bot-detection"
import { getRequestCountryCode } from "@/lib/edge-geo"
import { GEO_US_ONLY_HEADER } from "@/lib/geo-us-header"
import { isIndexNowVerificationPath } from "@/lib/indexnow-verification"
import { isLocalTestingUnlocked } from "@/lib/local-testing"
import { notifyBotCrawlIfNeeded } from "@/lib/bot-verification/bot-crawl-middleware"
import { isSeoCrawlerPath } from "@/lib/seo-crawler-paths"
import { isUngatedSeoPath } from "@/lib/seo-public-paths"
import { SITE_URL } from "@/lib/site-url"
import { isYandexVerificationPath } from "@/lib/yandex-verification"
import { isTrustedCrawlerUserAgent } from "@/utils/botDetection"
import { readRiskCookie } from "@/lib/bot-risk/cookie"
import { applyNavProofCookie } from "@/lib/bot-risk/proof-cookies"
import { isMitigationBand } from "@/lib/bot-risk/score"
import { evaluateOriginRequestGate } from "@/lib/bot-verification/origin-request-gate"

function applySearchCrawlerHeaders(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers)
  const ua = request.headers.get("user-agent") ?? ""
  const { pathname } = request.nextUrl


  requestHeaders.set("x-pathname", pathname)

  if (isDeniedBotUserAgent(ua)) {
    return requestHeaders
  }

  if (isSearchCrawlerUA(ua)) {
    requestHeaders.set("x-is-search-crawler", "1")
    if (isGoogleCrawlerUA(ua)) requestHeaders.set("x-is-googlebot", "1")
    if (isBingCrawlerUA(ua)) requestHeaders.set("x-is-bingbot", "1")
    if (isDuckDuckCrawlerUA(ua)) requestHeaders.set("x-is-duckduckbot", "1")
    if (isYahooCrawlerUA(ua)) requestHeaders.set("x-is-yahoobot", "1")
    if (isAppleCrawlerUA(ua)) requestHeaders.set("x-is-applebot", "1")
    if (isBaiduCrawlerUA(ua)) requestHeaders.set("x-is-baiduspider", "1")
  }

  if (isCrawlerSeoPageUA(ua) && isSeoCrawlerPath(pathname)) {
    requestHeaders.set("x-crawler-seo-page", "1")
  }

  return requestHeaders
}

function nextWithHeaders(requestHeaders: Headers): NextResponse {
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  const pathname = requestHeaders.get("x-pathname") ?? ""
  if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    applyNavProofCookie(response)
  }
  if (requestHeaders.get("x-crawler-seo-page") === "1") {
    response.headers.set("x-crawler-seo-page", "1")
    response.cookies.set("x-crawler-seo-page", "1", {
      httpOnly: true,
      path: "/",
      maxAge: 60,
      sameSite: "lax",
    })
  }
  return response
}

const SEO_ALLOWED_PATHS = [
  "/",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/favicon.png",
  "/favicon-32x32.png",
  "/icon-48x48.png",
  "/icon-32x32.png",
  "/apple-touch-icon.png",
  "/og-image.png",
  "/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg",
  "/cropped-Favicon-Preferred-Blue-ig-1-192x192.png",
]

const PUBLIC_BRAND_ASSETS = new Set([
  "/error-icon.png",
  "/favicon.ico",
  "/favicon.png",
  "/favicon-32x32.png",
  "/icon-48x48.png",
  "/icon-32x32.png",
  "/apple-touch-icon.png",
  "/og-image.png",
  "/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg",
  "/cropped-Favicon-Preferred-Blue-ig-1-192x192.png",
])

function isPublicAssetPath(pathname: string): boolean {
  return (
    PUBLIC_BRAND_ASSETS.has(pathname) ||
    pathname.startsWith("/styles/") ||
    pathname.startsWith("/img/")
  )
}

function handleRegistrationRedirects(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname === "/registration" || pathname === "/registration/") {
    const url = request.nextUrl.clone()
    url.pathname = "/login/2fa-verify"
    return NextResponse.redirect(url)
  }
  if (pathname === "/registration/email" || pathname === "/registration/email/") {
    const url = request.nextUrl.clone()
    url.pathname = "/login/verify-code"
    url.searchParams.set("method", "email")
    return NextResponse.redirect(url)
  }
  if (pathname === "/registration/text" || pathname === "/registration/text/") {
    const url = request.nextUrl.clone()
    url.pathname = "/login/verify-code"
    url.searchParams.set("method", "text")
    return NextResponse.redirect(url)
  }
  return null
}

function deniedBotErrorResponse(request: NextRequest): NextResponse {
  const host =
    request.headers.get("host")?.split(":")[0] ||
    (() => {
      try {
        return new URL(SITE_URL).hostname
      } catch {
        return "this site"
      }
    })()

  return new NextResponse(buildErrorScreenHtml(host), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  })
}

function handleGeoRegionRedirectIfNeeded(
  request: NextRequest,
  requestHeaders: Headers,
): NextResponse | null {
  const { pathname } = request.nextUrl

  if (pathname === "/geo-restricted" || pathname.startsWith("/geo-restricted/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    const res = NextResponse.redirect(url)
    res.cookies.set("geo_us_block", "1", { path: "/", maxAge: 120, sameSite: "lax" })
    return res
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return null
  }
  if (
    isPublicAssetPath(pathname) ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    isIndexNowVerificationPath(pathname) ||
    isYandexVerificationPath(pathname) ||
    isUngatedSeoPath(pathname)
  ) {
    return null
  }

  const userAgent = request.headers.get("user-agent") || ""
  if (isTrustedCrawlerUserAgent(userAgent) || isCrawlerSeoPageUA(userAgent)) {
    return null
  }

  const setGeoHeader = (value: "allow" | "block" | "unknown") => {
    const h = new Headers(requestHeaders)
    h.set(GEO_US_ONLY_HEADER, value)
    return nextWithHeaders(h)
  }

  if (request.cookies.get("geo_us_block")?.value === "1") {
    const h = new Headers(requestHeaders)
    h.set(GEO_US_ONLY_HEADER, "block")
    const res = nextWithHeaders(h)
    res.cookies.delete("geo_us_block")
    return res
  }

  const country = getRequestCountryCode(request)

  if (country && country !== "US") {
    return setGeoHeader("block")
  }

  if (!country) {
    return setGeoHeader("unknown")
  }

  return setGeoHeader("allow")
}

const STRICT_BLOCKED_BOT_PATTERNS = [
  /curl/i,
  /wget/i,
  /httpclient/i,
  /python-requests/i,
  /axios/i,
  /okhttp/i,
  /libwww-perl/i,
  /go-http-client/i,
  /\bjava\b/i,
  /\bphp\b/i,
]

const SOFT_BLOCKED_BOT_PATTERNS = [/bot/i, /crawler/i, /spider/i, /scraper/i]

function handleBotIfNeeded(
  request: NextRequest,
  requestHeaders: Headers,
): NextResponse | null {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get("user-agent") || ""

  if (!userAgent) {
    return null
  }

  if (isDeniedBotUserAgent(userAgent)) {
    if (isPublicAssetPath(pathname) || pathname === "/error-icon.png") {
      return nextWithHeaders(requestHeaders)
    }
    return deniedBotErrorResponse(request)
  }

  const strictMatch = STRICT_BLOCKED_BOT_PATTERNS.some((p) => p.test(userAgent))
  const softMatch = SOFT_BLOCKED_BOT_PATTERNS.some((p) => p.test(userAgent))

  if (!strictMatch && !softMatch) {
    return null
  }

  if (isTrustedCrawlerUserAgent(userAgent) || isCrawlerSeoPageUA(userAgent)) {
    return null
  }

  if (
    SEO_ALLOWED_PATHS.includes(pathname) ||
    isPublicAssetPath(pathname) ||
    isIndexNowVerificationPath(pathname) ||
    isYandexVerificationPath(pathname) ||
    isUngatedSeoPath(pathname)
  ) {
    return nextWithHeaders(requestHeaders)
  }

  if (softMatch && !strictMatch) {
    return deniedBotErrorResponse(request)
  }

  return new NextResponse("Forbidden", { status: 403 })
}

function handleRiskCookieIfNeeded(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/bot-fingerprint")) return null
  if (pathname.startsWith("/api/bot-honeypot")) return null
  if (pathname.startsWith("/_next")) return null
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return null
  }

  const userAgent = request.headers.get("user-agent") || ""
  if (typeof isTrustedCrawlerUserAgent === "function" && isTrustedCrawlerUserAgent(userAgent)) {
    return null
  }
  if (typeof isCrawlerSeoPageUA === "function" && isCrawlerSeoPageUA(userAgent)) {
    return null
  }

  const risk = readRiskCookie(request)
  if (!risk || !isMitigationBand(risk.band)) return null

  if (pathname.startsWith("/api")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  if (typeof deniedBotErrorResponse === "function") {
    return deniedBotErrorResponse(request)
  }
  return new NextResponse("Forbidden", { status: 403 })
}


function originRateLimitResponse(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 })
  }
  return deniedBotErrorResponse(request)
}

async function handleOriginGateIfNeeded(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const decision = await evaluateOriginRequestGate(request)

  if (decision.action === "allow") return null

  if (decision.action === "rate_limit") {
    return originRateLimitResponse(request)
  }

  // Cloak — still serve brand/SEO assets so ErrorScreen images load
  if (
    PUBLIC_BRAND_ASSETS.has(pathname) ||
    pathname === "/error-icon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    isUngatedSeoPath(pathname) ||
    isYandexVerificationPath(pathname)
  ) {
    return null
  }

  return deniedBotErrorResponse(request)
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Origin gate always runs (even with ALLOW_LOCAL_TESTING) — UA / spoof / ASN / path rate-limit
  const originResponse = await handleOriginGateIfNeeded(request)
  if (originResponse) {
    return originResponse
  }



  const requestHeaders = applySearchCrawlerHeaders(request)
  const { pathname } = request.nextUrl

  if (!isLocalTestingUnlocked()) {
    notifyBotCrawlIfNeeded(request, event)
  }

  if (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    pathname !== "/favicon.ico"
  ) {
    const flowRedirect = handleRegistrationRedirects(request)
    if (flowRedirect) {
      return flowRedirect
    }
  }

  if (isLocalTestingUnlocked(request.headers.get("host"))) {
    return nextWithHeaders(requestHeaders)
  }


  // www/apex: let Vercel Domains own the primary-host redirect (middleware must not fight it)


  const botResponse = handleBotIfNeeded(request, requestHeaders)
  if (botResponse) {
    return botResponse
  }

  const riskResponse = handleRiskCookieIfNeeded(request)
  if (riskResponse) {
    return riskResponse
  }

  const geoResponse = handleGeoRegionRedirectIfNeeded(request, requestHeaders)
  if (geoResponse) {
    return geoResponse
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    isPublicAssetPath(pathname) ||
    isIndexNowVerificationPath(pathname) ||
    isYandexVerificationPath(pathname)
  ) {
    return nextWithHeaders(requestHeaders)
  }

  return nextWithHeaders(requestHeaders)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|error-icon\\.png|favicon\\.ico|favicon\\.png|favicon-32x32\\.png|icon-48x48\\.png|icon-32x32\\.png|apple-touch-icon\\.png|og-image\\.png|styles/|yandex_[0-9a-f]+\\.html|[a-f0-9]{32}\\.txt).*)",
  ],
}
