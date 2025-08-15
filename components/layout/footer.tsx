'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-provider'

export function Footer() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <footer className="py-8 px-4 bg-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-gray-600">&copy; 2025 UpSkill. All rights reserved.</p>
        </div>

        <div className="flex gap-6">
          <Link href="/about" className="text-gray-600 hover:text-indigo-600">About</Link>
          <Link href="/privacy" className="text-gray-600 hover:text-indigo-600">Privacy</Link>
          <Link href="/terms" className="text-gray-600 hover:text-indigo-600">Terms</Link>
          <Link href="/contact" className="text-gray-600 hover:text-indigo-600">Contact</Link>
          <Link 
            href="/api-test" 
            className={`text-gray-600 hover:text-indigo-600 ${
              isActive('/api-test') ? 'text-indigo-600' : ''
            }`}
          >
            API Test
          </Link>
          <Link 
            href="/storage-test" 
            className={`text-gray-600 hover:text-indigo-600 ${
              isActive('/storage-test') ? 'text-indigo-600' : ''
            }`}
          >
            Storage Test
          </Link>
          {user && (
            <Link 
              href="/upload" 
              className={`text-gray-600 hover:text-indigo-600 ${
                isActive('/upload') ? 'text-indigo-600' : ''
              }`}
            >
              Upload
            </Link>
          )}
        </div>
      </div>
    </footer>
  )
}
