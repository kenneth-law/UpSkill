'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-provider'
import { clearSupabaseData } from '@/lib/utils/supabase'
import { Button } from '@/components/ui/button'
import { Menu, X, Upload, LogIn, UserPlus, LogOut, Home, Bot, LayoutDashboard } from 'lucide-react'
import logoImage from '@/components/media/logolarge.png'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      console.log('[DEBUG-UI] Starting sign out process from UI')
      closeMenu() // Close menu immediately for better UX

      // First, use our manual cleanup utility as a safeguard
      // This ensures we clear all auth data even if the Supabase signOut fails
      clearSupabaseData()

      // Then call the signOut method from auth provider
      // This uses the official Supabase method to sign out
      await signOut()

      console.log('[DEBUG-UI] Sign out successful, preparing to redirect')

      // Run the manual cleanup again after signOut for extra certainty
      clearSupabaseData()

      // Add a small delay to ensure all logout processes complete
      // This gives time for cookies and localStorage to be cleared
      setTimeout(() => {
        console.log('[DEBUG-UI] Redirecting after sign out')

        // Force a hard refresh to clear any cached state
        window.location.href = '/?logout=true'
      }, 500) // Increased to 500ms to give more time for cleanup
    } catch (error) {
      console.error('[DEBUG-UI] Error during sign out:', error)

      // Even if there's an error with the official signOut method,
      // our manual cleanup should have cleared most auth data

      // Run the manual cleanup again to be extra certain
      clearSupabaseData()

      // Even if there's an error, we should still redirect
      // This ensures the user experience is not disrupted
      setTimeout(() => {
        console.log('[DEBUG-UI] Redirecting after sign out error')

        // Force a hard refresh to clear any cached state
        window.location.href = '/?logout=error'
      }, 500)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <Image 
                src={logoImage} 
                alt="UpSkill Logo" 
                width={40} 
                height={40} 
                className="mr-1"
                priority
              />
              <span className="text-xl font-bold text-indigo-600">UpSkill</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>


            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard') 
                      ? 'text-white bg-purple-600' 
                      : 'text-white bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  Dashboard
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/login') 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
                  }`}
                >
                  Login
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
              }`}
              onClick={closeMenu}
            >
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Home
              </div>
            </Link>


            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/dashboard') 
                      ? 'text-white bg-purple-600' 
                      : 'text-white bg-purple-600 hover:bg-purple-700'
                  }`}
                  onClick={closeMenu}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/login') 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
                  }`}
                  onClick={closeMenu}
                >
                  <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Login
                  </div>
                </Link>
                <Link 
                  href="/signup" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/signup') 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-100'
                  }`}
                  onClick={closeMenu}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
