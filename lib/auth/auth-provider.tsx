'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/utils/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('[DEBUG-AUTH] Getting initial session')
      const { data, error } = await supabase.auth.getSession()

      console.log('[DEBUG-AUTH] Initial session result:', { 
        hasSession: !!data.session,
        hasUser: !!data.session?.user,
        hasError: !!error,
        errorMessage: error?.message
      })

      if (data.session?.user) {
        console.log('[DEBUG-AUTH] User authenticated:', { 
          userId: data.session.user.id,
          email: data.session.user.email,
          authProvider: data.session.user.app_metadata?.provider,
          sessionExpiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'unknown'
        })
      } else {
        console.log('[DEBUG-AUTH] No user session found. Checking localStorage for fallback...')
        // Check if we have any auth data in localStorage
        const localStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('supabase.auth'))
        console.log('[DEBUG-AUTH] Found localStorage keys:', localStorageKeys)
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    console.log('[DEBUG-AUTH] Setting up auth state change listener')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[DEBUG-AUTH] Auth state changed:', { 
          event, 
          hasSession: !!session,
          hasUser: !!session?.user
        })

        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    // Get the current URL and use it to determine the redirect URL
    // This ensures we use the actual host (IP or domain) that the user is accessing
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/verify-email`,
      }
    })

    if (error) {
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('[DEBUG-AUTH] Starting sign out process')

      // First, clear any local storage items related to auth
      if (typeof window !== 'undefined') {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase.auth') || key.includes('auth') || key.includes('session')
        )

        console.log('[DEBUG-AUTH] Clearing local storage auth items:', authKeys)
        authKeys.forEach(key => localStorage.removeItem(key))
      }

      // Then attempt to sign out through Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        // If the error is AuthSessionMissingError, we can ignore it
        // as we're already trying to sign out
        if (error.message.includes('Auth session missing')) {
          console.log('[DEBUG-AUTH] Session already expired or missing, clearing local state')
          // Clear local state anyway
          setUser(null)
          setSession(null)
          return
        }
        console.error('[DEBUG-AUTH] Error during sign out:', error)
        throw error
      }

      console.log('[DEBUG-AUTH] Successfully signed out from Supabase')

      // Clear React state
      setUser(null)
      setSession(null)

      // Clear any cookies manually if possible
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i]
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          if (name.includes('supabase') || name.includes('auth') || name.includes('session')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
            console.log(`[DEBUG-AUTH] Cleared cookie: ${name}`)
          }
        }
      }

      console.log('[DEBUG-AUTH] Sign out process completed')
    } catch (error) {
      console.error('[DEBUG-AUTH] Error during sign out process:', error)
      // Clear local state anyway to ensure user is logged out in UI
      setUser(null)
      setSession(null)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    // Get the current URL and use it to determine the redirect URL
    // This ensures we use the actual host (IP or domain) that the user is accessing
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    })

    if (error) {
      throw error
    }
  }

  const signInWithGoogle = async () => {
    // Get the current URL and use it to determine the redirect URL
    // This ensures we use the actual host (IP or domain) that the user is accessing
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/dashboard`,
      },
    })

    if (error) {
      throw error
    }
  }


  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
