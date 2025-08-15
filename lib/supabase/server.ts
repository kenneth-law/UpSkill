import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// For both server components and API routes in Next.js 15
export async function createServerClient() {
  console.log('[DEBUG-SERVER] Creating Supabase server client')

  // Await cookies() - this is required in Next.js 15
  const cookieStore = await cookies()

  // Log cookie information (without exposing sensitive data)
  const allCookies = cookieStore.getAll()
  const cookieNames = allCookies.map(cookie => cookie.name)

  // Check specifically for Supabase auth cookies
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.includes('supabase') || 
    cookie.name.includes('sb-') || 
    cookie.name.includes('auth')
  )

  console.log('[DEBUG-SERVER] Available cookies:', {
    count: cookieNames.length,
    names: cookieNames,
    hasAuthCookie: supabaseCookies.length > 0,
    authCookieNames: supabaseCookies.map(c => c.name),
    // Log partial values for auth cookies to help debug without exposing full tokens
    authCookiePartialValues: supabaseCookies.map(c => ({
      name: c.name,
      valuePreview: c.value ? `${c.value.substring(0, 10)}...` : 'empty',
      length: c.value?.length || 0
    }))
  })

  console.log('[DEBUG-SERVER] Supabase environment variables:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name)
        return cookie?.value
      },
      getAll() {
        return cookieStore.getAll()
      },
      set(name: string, value: string, options?: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // This can happen when called from a Server Component
          // Can be safely ignored if you have middleware handling sessions
          console.log('[DEBUG-SERVER] Cookie set error (expected in Server Components):', error)
        }
      },
      remove(name: string, options?: any) {
        try {
          cookieStore.delete({ name, ...options })
        } catch (error) {
          // This can happen when called from a Server Component
          console.log('[DEBUG-SERVER] Cookie remove error (expected in Server Components):', error)
        }
      }
    },
  })

  console.log('[DEBUG-SERVER] Supabase client created successfully')
  return client
}

// Export only createRouteHandler for backward compatibility
export const createRouteHandler = createServerClient
