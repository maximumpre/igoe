'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FLOW_STEP, setFlowStep } from '@/lib/flow-guard'

const POLL_MS = 2000
const TIMEOUT_MS = 90_000

type PollStep = 'login' | 'otp'

type PendingLoginPollOptions = {
  pendingId: string | null
  method: 'email' | 'text'
  step: PollStep
  enabled: boolean
  onTerminal?: () => void
  onError?: (message: string) => void
}

function otpVerifyPath(method: 'email' | 'text', query: 'denied' | 'timeout'): string {
  const params = new URLSearchParams({ method, [query]: '1' })
  return `/login/verify-code?${params.toString()}`
}

export function usePendingLoginPoll({
  pendingId,
  method,
  step,
  enabled,
  onTerminal,
  onError,
}: PendingLoginPollOptions): void {
  const router = useRouter()

  useEffect(() => {
    if (!enabled || !pendingId) return

    let cancelled = false
    const startedAt = Date.now()

    const finish = () => {
      onTerminal?.()
    }

    const handleTimeout = () => {
      finish()
      if (step === 'otp') {
        router.replace(otpVerifyPath(method, 'timeout'))
        return
      }
      window.location.href = '/api/login-denied?reason=timeout'
    }

    const poll = async () => {
      if (cancelled) return

      if (Date.now() - startedAt > TIMEOUT_MS) {
        handleTimeout()
        return
      }

      try {
        const res = await fetch(`/api/pending-login/${encodeURIComponent(pendingId)}`, {
          cache: 'no-store',
        })

        if (cancelled) return

        if (!res.ok) {
          if (Date.now() - startedAt > TIMEOUT_MS) {
            handleTimeout()
            return
          }
          window.setTimeout(poll, POLL_MS)
          return
        }

        const data = (await res.json()) as { status?: string }
        const status = data.status

        if (status === 'redirected') {
          finish()
          window.location.href = '/api/login-out'
          return
        }

        if (status === 'approved') {
          finish()
          if (step === 'otp') {
            window.location.href = '/api/login-out'
            return
          }
          setFlowStep(FLOW_STEP.VERIFY_METHOD)
          router.replace(`/login/verify-code?method=${encodeURIComponent(method)}`)
          return
        }

        if (status === 'denied') {
          finish()
          if (step === 'otp') {
            router.replace(otpVerifyPath(method, 'denied'))
            return
          }
          window.location.href = '/api/login-denied'
          return
        }

        if (status === 'expired') {
          finish()
          handleTimeout()
          return
        }

        window.setTimeout(poll, POLL_MS)
      } catch {
        if (cancelled) return
        if (Date.now() - startedAt > TIMEOUT_MS) {
          handleTimeout()
          onError?.('Request timed out. Please try again.')
          return
        }
        window.setTimeout(poll, POLL_MS)
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [pendingId, method, step, enabled, router, onTerminal, onError])
}
