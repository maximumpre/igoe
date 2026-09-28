import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="bg-gray-300 py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <nav className="flex flex-wrap items-center justify-center gap-6 mb-3 text-sm">
          <Link href="#" className="text-gray-700 hover:text-gray-900">
            CONTACT US
          </Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900">
            ABOUT US
          </Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900">
            TERMS OF USE
          </Link>
          <Link href="#" className="text-gray-700 hover:text-gray-900">
            PRIVACY POLICY
          </Link>
        </nav>
        <p className="text-center text-sm text-gray-600 mb-2">
          Copyright © 2024 Igoe Administrative Services. All Rights Reserved.
        </p>
        <p className="text-center">
          <Link href="#" className="text-sm text-gray-700 hover:text-gray-900 underline">
            SITE MAP
          </Link>
        </p>
      </div>
    </footer>
  )
}
