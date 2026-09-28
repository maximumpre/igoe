"use client"

import { useRouter } from "next/navigation"
import { useEffect, useSyncExternalStore } from "react"

const FLOW_KEY = "flow_max_step"
const REGISTRATION_KEY = "registration_max_step"

export const FLOW_STEP = {
  LOGIN: 1,
  VERIFY_METHOD: 2,
  VERIFY_CODE: 3,
} as const

export const REGISTRATION_STEP = {
  METHOD: 1,
  VERIFY: 2,
} as const

function getMaxStep(key: string): number {
  if (typeof window === "undefined") return 0
  return Number(sessionStorage.getItem(key) || "0")
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const notify = () => callback()
  window.addEventListener("storage", notify)
  window.addEventListener("flow-step-change", notify)
  return () => {
    window.removeEventListener("storage", notify)
    window.removeEventListener("flow-step-change", notify)
  }
}

export function setFlowStep(step: number): void {
  if (typeof window === "undefined") return
  const current = getMaxStep(FLOW_KEY)
  if (step > current) {
    sessionStorage.setItem(FLOW_KEY, String(step))
    window.dispatchEvent(new Event("flow-step-change"))
  }
}

export function resetFlow(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(FLOW_KEY)
  sessionStorage.removeItem("loginReady")
}

export function setRegistrationStep(step: number): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(REGISTRATION_KEY, String(step))
}

export function resetRegistrationFlow(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(REGISTRATION_KEY)
  sessionStorage.removeItem("verificationEmail")
  sessionStorage.removeItem("verificationPhone")
}

function useStepGuard(
  storageKey: string,
  requiredStep: number,
  redirectTo: string,
): boolean {
  const router = useRouter()
  const getStep = () => getMaxStep(storageKey)
  const maxStep = useSyncExternalStore(subscribe, getStep, () => 0)

  useEffect(() => {
    if (maxStep < requiredStep) {
      const id = window.setTimeout(() => {
        if (getMaxStep(storageKey) < requiredStep) {
          router.replace(redirectTo)
        }
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [maxStep, requiredStep, redirectTo, router, storageKey])

  return maxStep >= requiredStep
}

export function useFlowGuard(requiredStep: number): boolean {
  return useStepGuard(FLOW_KEY, requiredStep, "/")
}

export function useRegistrationFlowGuard(requiredStep: number): boolean {
  return useStepGuard(REGISTRATION_KEY, requiredStep, "/login/2fa-verify")
}
