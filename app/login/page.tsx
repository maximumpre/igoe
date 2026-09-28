import { permanentRedirect } from "next/navigation"

export default async function LegacyLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v))
    else query.set(key, value)
  }
  const suffix = query.toString()
  permanentRedirect(suffix ? `/?${suffix}` : "/")
}
