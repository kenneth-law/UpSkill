import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/utils/supabase'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to update a topic's status
 */
export async function PATCH(request: NextRequest) {
  const params = { id: request.nextUrl.pathname.split('/').pop() || '' }
  try {
    // Get the topic ID from the URL
    const topicId = params.id

    // Validate the topic ID
    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Get the user's session
    const supabaseClient = await createServerClient()
    const { data: { session } } = await supabaseClient.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Parse the request body
    const body = await request.json()

    // Validate the request body
    if (body.is_active === undefined) {
      return NextResponse.json(
        { error: 'is_active field is required' },
        { status: 400 }
      )
    }

    // First, check if the topic belongs to the authenticated user
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('user_id')
      .eq('id', topicId)
      .single()

    if (topicError) {
      console.error('Error fetching topic:', {
        code: topicError.code,
        message: topicError.message,
        details: topicError.details,
        hint: topicError.hint,
        topicId
      })

      if (topicError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch topic' },
        { status: 500 }
      )
    }

    // Check if the topic belongs to the authenticated user
    if (topicData.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own topics' },
        { status: 403 }
      )
    }

    // Update the topic in the database
    const { data, error } = await supabase
      .from('topics')
      .update({ is_active: body.is_active })
      .eq('id', topicId)
      .select()

    if (error) {
      console.error('Error updating topic:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        topicId
      })

      return NextResponse.json(
        { error: 'Failed to update topic' },
        { status: 500 }
      )
    }

    // Return the updated topic
    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error updating topic:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}

/**
 * API endpoint to delete a topic
 */
export async function DELETE(request: NextRequest) {
  const params = { id: request.nextUrl.pathname.split('/').pop() || '' }
  console.log('[DEBUG-DELETE] Starting DELETE request for topic:', params.id)

  try {
    // Log request details
    console.log('[DEBUG-DELETE] Request headers:', {
      contentType: request.headers.get('content-type'),
      cookie: request.headers.has('cookie') ? 'Present' : 'Missing',
      authorization: request.headers.has('authorization') ? 'Present' : 'Missing'
    })

    // Get the topic ID from the URL
    const topicId = params.id
    console.log('[DEBUG-DELETE] Topic ID from params:', topicId)

    // Validate the topic ID
    if (!topicId) {
      console.log('[DEBUG-DELETE] Missing topic ID, returning 400')
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Get the user's session using the createServerClient function
    console.log('[DEBUG-DELETE] Getting user session using createServerClient')
    const supabaseClient = await createServerClient()
    const { data: { session } } = await supabaseClient.auth.getSession()

    console.log('[DEBUG-DELETE] Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id?.substring(0, 8) + '...' // Log partial ID for privacy
    })

    // Log cookie information for debugging
    const cookieHeader = request.headers.get('cookie')
    console.log('[DEBUG-DELETE] Cookie header present:', !!cookieHeader)
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim())
      const authCookies = cookies.filter(c => 
        c.startsWith('sb-') || 
        c.includes('supabase') || 
        c.includes('auth')
      )
      console.log('[DEBUG-DELETE] Auth cookies found:', authCookies.length > 0)
      console.log('[DEBUG-DELETE] Auth cookie names:', authCookies.map(c => c.split('=')[0]))
    }

    // For production, we require authentication
    if (!session?.user) {
      console.log('[DEBUG-DELETE] No authenticated user found, returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log('[DEBUG-DELETE] User ID from session:', userId.substring(0, 8) + '...')

    // Create a new Supabase client with the session token
    console.log('[DEBUG-DELETE] Creating authenticated Supabase client with session token')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    // Create a client with the session token for authenticated access
    const dbClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    })

    console.log('[DEBUG-DELETE] Created authenticated Supabase client')

    console.log('[DEBUG-DELETE] Checking if topic belongs to user')

    // Log the query we're about to execute
    console.log('[DEBUG-DELETE] Executing query:', {
      table: 'topics',
      operation: 'select',
      columns: 'user_id',
      filter: { id: topicId }
    })

    const { data: topicData, error: topicError } = await dbClient
      .from('topics')
      .select('user_id')
      .eq('id', topicId)
      .single()

    if (topicError) {
      console.error('[DEBUG-DELETE] Error fetching topic:', {
        code: topicError.code,
        message: topicError.message,
        details: topicError.details,
        hint: topicError.hint,
        topicId
      })

      if (topicError.code === 'PGRST116') {
        console.log('[DEBUG-DELETE] Topic not found, returning 404')
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        )
      }

      console.log('[DEBUG-DELETE] Failed to fetch topic, returning 500')
      return NextResponse.json(
        { error: 'Failed to fetch topic' },
        { status: 500 }
      )
    }

    console.log('[DEBUG-DELETE] Topic data retrieved:', {
      topicId,
      topicUserId: topicData.user_id.substring(0, 8) + '...',
      currentUserId: userId.substring(0, 8) + '...',
      isOwner: topicData.user_id === userId
    })

    // Check if the topic belongs to the authenticated user
    if (topicData.user_id !== userId) {
      console.log('[DEBUG-DELETE] User is not the owner of the topic, returning 403')
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own topics' },
        { status: 403 }
      )
    }

    // Delete the topic from the database
    console.log('[DEBUG-DELETE] Deleting topic from database using dbClient')

    // Log the query we're about to execute
    console.log('[DEBUG-DELETE] Executing delete query:', {
      table: 'topics',
      operation: 'delete',
      filter: { id: topicId }
    })

    const { error, count } = await dbClient
      .from('topics')
      .delete()
      .eq('id', topicId)
      .select('count')

    console.log('[DEBUG-DELETE] Delete operation result:', {
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      rowsAffected: count
    })

    if (error) {
      console.error('[DEBUG-DELETE] Error deleting topic:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        topicId
      })

      console.log('[DEBUG-DELETE] Failed to delete topic, returning 500')
      return NextResponse.json(
        { error: 'Failed to delete topic' },
        { status: 500 }
      )
    }

    // Return success response
    console.log('[DEBUG-DELETE] Topic deleted successfully')
    return NextResponse.json({ success: true, message: 'Topic deleted successfully' })
  } catch (error) {
    // Get detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : String(error);

    console.error('[DEBUG-DELETE] Exception in DELETE handler:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    })

    console.log('[DEBUG-DELETE] Returning 500 error response')
    return NextResponse.json(
      { 
        error: 'Failed to delete topic',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
