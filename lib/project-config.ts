export const PROJECT_ID = "igoe-goigoe"

export const DEFAULT_PROJECT_ID = PROJECT_ID

export const ALLOWED_BACKLINK_HOSTS: string[] = []

export const PROJECT_DISPLAY_NAME = "Goigoe Wealthcare"

export function getApprovalsUrl(): string {
  let adminUrlBase = (process.env.ADMIN_PORTAL_URL || "").trim()
  if (!adminUrlBase) return "/admin/login"
  if (!/^https?:\/\//i.test(adminUrlBase) && !adminUrlBase.startsWith("/") && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(adminUrlBase)) {
    adminUrlBase = `https://${adminUrlBase}`
  }
  return adminUrlBase
    .replace(/\/+$/, "")
    .replace(/\/admin\/login.*$/i, "")
    .replace(/\?.*$/, "") || "/admin/login"
}
