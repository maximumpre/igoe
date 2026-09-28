import Link from "next/link"
import Image from "next/image"

export function LoginFlowHeader() {
  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between md:justify-start">
        <Link href="/" className="flex items-center">
          <Image
            src="/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
            alt="Goigoe Wealthcare Portal"
            width={140}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <div className="ml-6 text-xl text-gray-700 font-normal hidden md:block">Login</div>
      </div>
    </header>
  )
}
