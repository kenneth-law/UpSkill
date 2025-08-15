import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase'

/**
 * API endpoint to retrieve game content from the database
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const courseId = url.searchParams.get('courseId')
    const gameType = url.searchParams.get('gameType')
    const lessonId = url.searchParams.get('lessonId')

    console.log('[DEBUG] Fetching game session for:', {
      courseId,
      gameType,
      lessonId
    })

    // Validate required parameters
    if (!courseId || !gameType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Query the database for the most recent game session
    const query = supabase
      .from('game_sessions')
      .select('*')
      .eq('course_id', courseId)
      .eq('game_type', gameType);

    // Add lessonId filter if provided to differentiate between different games of the same type
    if (lessonId) {
      query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching game session:', error)

      // If no game session is found, return a 404 status
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Game session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch game session' },
        { status: 500 }
      )
    }

    // Return the game content
    return NextResponse.json({
      gameContent: data.content,
      concepts: data.concepts
    })
  } catch (error) {
    console.error('Error retrieving game content:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve game content' },
      { status: 500 }
    )
  }
}
