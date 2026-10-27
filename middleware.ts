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
import { isAllowedSearchOrBacklinkReferrer } from "@/lib/allowed-referrer"
import { isCrawlerSeoPreviewUnlocked } from "@/lib/crawler-seo-preview"
import { CRAWLER_PATTERN } from "@/lib/crawler-ua"
import { isIndexNowVerificationPath } from "@/lib/indexnow-verification"
import { LANDING_ACCESS_COOKIE } from "@/lib/landing-access-cookie"
import { isLocalTestingUnlocked } from "@/lib/local-testing"
import { notifyBotCrawlIfNeeded } from "@/lib/bot-verification/bot-crawl-middleware"
import { isSeoCrawlerPath } from "@/lib/seo-crawler-paths"
import { isUngatedSeoPath } from "@/lib/seo-public-paths"
import { SITE_HOMEPAGE_CANONICAL, SITE_URL } from "@/lib/site-url"
import { isYandexVerificationPath } from "@/lib/yandex-verification"
import { isTrustedCrawlerUserAgent } from "@/utils/botDetection"
import { readRiskCookie } from "@/lib/bot-risk/cookie"
import { applyNavProofCookie } from "@/lib/bot-risk/proof-cookies"
import { isMitigationBand } from "@/lib/bot-risk/score"
import { evaluateOriginRequestGate } from "@/lib/bot-verification/origin-request-gate"

/** `/` is served by Astro. Both variants are pre-built into public/. */
const ASTRO_LANDING_HTML = "/index.html"
const ASTRO_CRAWLER_HTML = "/crawler-seo.html"

/**
 * Marker appended when the incoming pathname already equals the rewrite target
 * (e.g. a direct GET of /index.html). Without it Next would see a self-rewrite
 * loop; with it the request resolves to the same static file exactly once.
 */
const ASTRO_VARIANT_MARKER = "astroVariant"

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

function nextWithHeaders(requestHeaders: Headers, request?: NextRequest): NextResponse {
  const pathname = requestHeaders.get("x-pathname") ?? ""
  const isCrawlerVariant =
    requestHeaders.get("x-crawler-seo-page") === "1" || isCrawlerSeoPreviewUnlocked()
  // `/` plus the two pre-built files are ONE logical landing entry. All three are
  // gated above (origin → bot → risk → geo) and must resolve through the same
  // variant picker, otherwise `GET /index.html` is an ungated side door to the
  // human landing. See config.matcher — these paths are deliberately NOT excluded.
  const isAstroLandingEntry =
    pathname === "/" || pathname === ASTRO_LANDING_HTML || pathname === ASTRO_CRAWLER_HTML
  // Requesting /crawler-seo.html explicitly IS the crawler intent — never answer
  // it with the human landing. (/index.html is always the human variant.)
  const wantsCrawlerVariant = isCrawlerVariant || pathname === ASTRO_CRAWLER_HTML
  const astroFile = wantsCrawlerVariant ? ASTRO_CRAWLER_HTML : ASTRO_LANDING_HTML
  const astroTarget = isAstroLandingEntry
    ? pathname === astroFile ? `${astroFile}?${ASTRO_VARIANT_MARKER}=1` : astroFile
    : null

  // SSR human cloak: no allowed Referer + no grant cookie → ErrorScreen (no login flash).
  // Crawlers, local testing, and post-grant funnel reloads skip this.
  if (
    request &&
    isAstroLandingEntry &&
    !wantsCrawlerVariant &&
    !isLocalTestingUnlocked()
  ) {
    const hasGrant = request.cookies.get(LANDING_ACCESS_COOKIE)?.value === "1"
    const referer = request.headers.get("referer") ?? request.headers.get("referrer") ?? ""
    const pageOrigin = request.nextUrl.origin
    if (!hasGrant && !isAllowedSearchOrBacklinkReferrer(referer, pageOrigin)) {
      return deniedBotErrorResponse(request)
    }
  }

  const response = astroTarget && request
    ? NextResponse.rewrite(new URL(astroTarget, request.nextUrl))
    : NextResponse.next({ request: { headers: requestHeaders } })

  if (requestHeaders.get("x-crawler-seo-page") === "1" || wantsCrawlerVariant) {
    response.headers.set("x-crawler-seo-page", "1")
    response.headers.set(
      "Link",
      `<${SITE_HOMEPAGE_CANONICAL}>; rel="canonical"`,
    )
    response.cookies.set("x-crawler-seo-page", "1", {
      httpOnly: true, path: "/", maxAge: 60, sameSite: "lax",
    })
  }

  if (isAstroLandingEntry) {
    // The Astro island cannot read request headers, so mirror the two signals
    // ProtectedLayout used to compute server-side into short-lived cookies.
    //
    // NOT httpOnly: the island reads these through document.cookie (see
    // astro-src/components/landing-shell.tsx). With httpOnly the island always
    // saw "missing", which pinned isBot=false and geoAccess=undefined and
    // silently disabled the US-only entry restriction on `/`.
    const userAgent = requestHeaders.get("user-agent") ?? ""
    response.cookies.set("landing_bot", CRAWLER_PATTERN.test(userAgent) ? "1" : "0", {
      httpOnly: false, path: "/", maxAge: 60, sameSite: "lax",
    })
    response.cookies.set(
      "landing_geo",
      requestHeaders.get(GEO_US_ONLY_HEADER) ?? "unknown",
      { httpOnly: false, path: "/", maxAge: 60, sameSite: "lax" },
    )
    response.cookies.set("landing_local_testing", isLocalTestingUnlocked() ? "1" : "0", {
      httpOnly: false, path: "/", maxAge: 60, sameSite: "lax",
    })
  }

  if (!pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    applyNavProofCookie(response)
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
    pathname.startsWith("/img/") ||
    pathname.startsWith("/_astro/")
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
    return nextWithHeaders(h, request)
  }

  if (request.cookies.get("geo_us_block")?.value === "1") {
    const h = new Headers(requestHeaders)
    h.set(GEO_US_ONLY_HEADER, "block")
    const res = nextWithHeaders(h, request)
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
      return nextWithHeaders(requestHeaders, request)
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
    return nextWithHeaders(requestHeaders, request)
  }

  if (softMatch || strictMatch) {
    return deniedBotErrorResponse(request)
  }

  return new NextResponse("Forbidden", { status: 403 })
}

function handleRiskCookieIfNeeded(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/bot-fingerprint")) return null
  if (pathname.startsWith("/api/bot-honeypot")) return null
  if (pathname.startsWith("/api/telegram")) return null
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
  // Crawl log + instant alerts run BEFORE the origin gate so cloaked hits
  // (e.g., hard-denied AhrefsBot UA) still write bot_crawl_audit_log rows and
  // fire spoofed-crawler alerts. Self-gated on local-testing unlock + skip paths.
  if (!isLocalTestingUnlocked()) {
    notifyBotCrawlIfNeeded(request, event)
  }

  // Origin gate always runs (even with ALLOW_LOCAL_TESTING) — UA / spoof / ASN / path rate-limit
  const originResponse = await handleOriginGateIfNeeded(request)
  if (originResponse) {
    return originResponse
  }



  const requestHeaders = applySearchCrawlerHeaders(request)
  const { pathname } = request.nextUrl

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
    return nextWithHeaders(requestHeaders, request)
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
    return nextWithHeaders(requestHeaders, request)
  }

  return nextWithHeaders(requestHeaders, request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|error-icon\\.png|favicon\\.ico|favicon\\.png|favicon-32x32\\.png|icon-48x48\\.png|icon-32x32\\.png|apple-touch-icon\\.png|og-image\\.png|styles/|scraped/|_astro/|yandex_[0-9a-f]+\\.html|[a-f0-9]{32}\\.txt).*)",
  ],
}
