import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json'
    }
  }
})

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  try {
    // Validate userId
    if (!userId) {
      console.error('Error fetching user profile: userId is required')
      return null
    }

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Log detailed error information
      console.error('Error fetching user profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId: userId
      })

      // Check for specific error types
      if (error.code === 'PGRST116') {
        console.error('User profile not found. The user might not have a profile yet.')
      } else if (error.code?.startsWith('PGRST')) {
        console.error('PostgreSQL REST API error. Check database connection and schema.')
      } else if (error.code?.startsWith('22P02')) {
        console.error('Invalid input syntax. Check if userId is a valid UUID.')
      }

      return null
    }

    return data
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Exception fetching user profile:', {
      message: errorMessage,
      stack: errorStack,
      userId: userId
    })

    return null
  }
}

// Helper function to create or update user profile
export async function upsertUserProfile(profile: any) {
  try {
    // Validate profile object
    if (!profile || !profile.id) {
      console.error('Error upserting user profile: profile object must include id')
      return null
    }

    const { data, error } = await supabase
      .from('users_profile')
      .upsert(profile)
      .select()

    if (error) {
      // Log detailed error information
      console.error('Error upserting user profile:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        profileId: profile.id
      })

      // Check for specific error types
      if (error.code === '23505') {
        console.error('Duplicate key violation. A profile with this id or username might already exist.')
      } else if (error.code?.startsWith('23')) {
        console.error('Database constraint violation. Check if all required fields are provided.')
      } else if (error.code?.startsWith('PGRST')) {
        console.error('PostgreSQL REST API error. Check database connection and schema.')
      }

      return null
    }

    return data
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Exception upserting user profile:', {
      message: errorMessage,
      stack: errorStack,
      profileId: profile?.id
    })

    return null
  }
}

// Helper function to fetch topics for a user
export async function getUserTopics(userId: string) {
  try {
    // Validate userId
    if (!userId) {
      console.error('Error fetching user topics: userId is required')
      return []
    }

    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      // Log detailed error information
      console.error('Error fetching user topics:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId: userId
      })

      // Check for specific error types
      if (error.code?.startsWith('PGRST')) {
        console.error('PostgreSQL REST API error. Check database connection and schema.')
      } else if (error.code?.startsWith('22P02')) {
        console.error('Invalid input syntax. Check if userId is a valid UUID.')
      }

      return []
    }

    return data
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Exception fetching user topics:', {
      message: errorMessage,
      stack: errorStack,
      userId: userId
    })

    return []
  }
}

// Helper function to create a new topic
export async function createTopic(topic: any) {
  try {
    // Validate topic object
    if (!topic || !topic.user_id || !topic.title) {
      console.error('Error creating topic: topic object must include user_id and title')
      return null
    }

    const { data, error } = await supabase
      .from('topics')
      .insert(topic)
      .select()

    if (error) {
      // Log detailed error information
      console.error('Error creating topic:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        topic: { ...topic, user_id: topic.user_id } // Include user_id for debugging but avoid logging sensitive data
      })

      // Check for specific error types
      if (error.code === '23505') {
        console.error('Duplicate key violation. A topic with this title might already exist.')
      } else if (error.code?.startsWith('23')) {
        console.error('Database constraint violation. Check if all required fields are provided.')
      } else if (error.code?.startsWith('PGRST')) {
        console.error('PostgreSQL REST API error. Check database connection and schema.')
      }

      return null
    }

    return data[0]
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Exception creating topic:', {
      message: errorMessage,
      stack: errorStack,
      topicInfo: { title: topic?.title, user_id: topic?.user_id } // Log minimal info for debugging
    })

    return null
  }
}

// Helper function to upload a file to storage
export async function uploadFile(bucket: string, path: string, file: File) {
  try {
    // Validate parameters
    if (!bucket) {
      console.error('Error uploading file: bucket name is required')
      return null
    }

    if (!path) {
      console.error('Error uploading file: path is required')
      return null
    }

    if (!file) {
      console.error('Error uploading file: file is required')
      return null
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      // Log detailed error information
      console.error('Error uploading file:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        bucket,
        path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })

      // Check for specific error types
      if (error.message?.includes('bucket not found')) {
        console.error(`Bucket '${bucket}' not found. Make sure it exists in your Supabase storage.`)
      } else if (error.message?.includes('permission denied')) {
        console.error('Permission denied. Check your RLS policies for storage access.')
      } else if (error.message?.includes('size limit')) {
        console.error(`File size exceeds the limit. Current file size: ${file.size} bytes.`)
      }

      return null
    }

    return data
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Exception uploading file:', {
      message: errorMessage,
      stack: errorStack,
      bucket,
      path,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    })

    return null
  }
}

// Helper function to get a public URL for a file
export function getPublicUrl(bucket: string, path: string) {
  try {
    // Validate parameters
    if (!bucket) {
      console.error('Error getting public URL: bucket name is required')
      return ''
    }

    if (!path) {
      console.error('Error getting public URL: path is required')
      return ''
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!data || !data.publicUrl) {
      console.error('Error getting public URL: No URL returned', {
        bucket,
        path
      })
      return ''
    }

    return data.publicUrl
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Exception getting public URL:', {
      message: errorMessage,
      stack: errorStack,
      bucket,
      path
    })

    return ''
  }
}

// Utility function to manually clear all Supabase auth data
// This can be used as a fallback if the standard signOut method fails
export function clearSupabaseData() {
  console.log('[DEBUG-SUPABASE] Manually clearing all Supabase auth data')

  try {
    // Clear localStorage items
    if (typeof window !== 'undefined' && window.localStorage) {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('sb-')
      )

      console.log('[DEBUG-SUPABASE] Clearing localStorage items:', authKeys)
      authKeys.forEach(key => localStorage.removeItem(key))
    }

    // Clear cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

        if (
          name.includes('supabase') || 
          name.includes('auth') || 
          name.includes('session') ||
          name.includes('sb-')
        ) {
          // Clear the cookie with various path and domain combinations to ensure it's removed
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`

          console.log(`[DEBUG-SUPABASE] Cleared cookie: ${name}`)
        }
      }
    }

    console.log('[DEBUG-SUPABASE] Manual cleanup completed')
    return true
  } catch (error) {
    console.error('[DEBUG-SUPABASE] Error during manual cleanup:', error)
    return false
  }
}
