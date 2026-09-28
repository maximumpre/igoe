/**
 * Local QA bypass for geo/referrer gates.
 * Never honored on Vercel production — even if ALLOW_LOCAL_TESTING is set there by mistake.
 */

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"])

export function isLocalhostHost(host: string | null | undefined): boolean {
  if (!host) return false
  const hostname = host.split(":")[0]?.toLowerCase()
  if (!hostname) return false
  return LOCALHOST_HOSTS.has(hostname) || hostname.endsWith(".localhost")
}

export function isLocalTestingUnlocked(host?: string | null): boolean {
  if (process.env.VERCEL_ENV === "production") {
    return false
  }

  if (host && isLocalhostHost(host)) {
    return true
  }

  const value = process.env.ALLOW_LOCAL_TESTING?.trim().toLowerCase()
  return value === "true" || value === "1" || value === "yes"
}
