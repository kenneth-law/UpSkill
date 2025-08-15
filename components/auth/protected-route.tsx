'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-provider'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If authentication is still loading, do nothing
    if (isLoading) {
      console.log('[DEBUG-PROTECTED] Auth is still loading')
      return
    }

    console.log('[DEBUG-PROTECTED] Auth state updated:', { 
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      provider: user?.app_metadata?.provider
    })

    // If user is not authenticated, redirect to login
    if (!user) {
      console.log('[DEBUG-PROTECTED] User not authenticated, redirecting to login')

      // Check localStorage for any auth-related data
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth') || key.includes('token')
      )
      console.log('[DEBUG-PROTECTED] Auth-related localStorage keys:', localStorageKeys)

      router.push('/login')
    } else {
      console.log('[DEBUG-PROTECTED] User is authenticated, rendering protected content')
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show nothing (will redirect)
  if (!user) {
    return null
  }

  // If authenticated, render children
  return <>{children}</>
}

// Higher-order component for wrapping pages
export function withProtection<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
