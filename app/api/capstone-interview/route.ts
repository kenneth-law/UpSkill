import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: openaiApiKey,
})

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Only create the client if both URL and key are available
let supabase
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * API endpoint to create a new capstone interview session
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user's session from the cookie
    let session;
    try {
      const cookieStore = cookies()
      const supabaseClient = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      const { data } = await supabaseClient.auth.getSession()
      session = data.session
    } catch (authError) {
      console.error('Error getting user session:', authError)
      // Continue without session, we'll handle unauthenticated users
    }

    // Parse the request body
    let body;
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { courseId, lessonId, topic, interviewType = 'text' } = body

    if (!courseId || !topic) {
      return NextResponse.json(
        { error: 'Missing required parameters: courseId and topic are required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // Create a system prompt for the capstone interview
    const systemPrompt = `You are an expert interviewer conducting a ${interviewType === 'voice' ? 'voice' : 'text'} interview on the topic of "${topic}". 
Your goal is to help the user synthesize and demonstrate their knowledge on this subject.

# Interview Structure
1. Start with a brief introduction and explain the purpose of this capstone interview.
2. Ask 3-5 thoughtful questions that require the user to synthesize their knowledge.
3. For each response, provide constructive feedback and ask follow-up questions to deepen their understanding.
4. At the end, provide a summary of their strengths and areas for improvement.

# Guidelines
- Ask one question at a time and wait for the user's response.
- Your questions should encourage critical thinking and knowledge synthesis.
- Provide constructive feedback that acknowledges strengths and suggests improvements.
- Maintain a professional and encouraging tone throughout the interview.
- If the user struggles, provide hints or rephrase the question to help them.

Begin the interview by introducing yourself and explaining the purpose of this capstone interview.`

    // Create a new game session in the database
    let gameSessionId;
    if (session?.user && supabase) {
      try {
        const userId = session.user.id

        // Create initial interview content
        const initialContent = {
          topic: topic,
          interviewType: interviewType,
          questions: [],
          responses: [],
          feedback: "",
          status: "started"
        }

        // Insert the game session
        const { data: gameSession, error: insertError } = await supabase
          .from('game_sessions')
          .insert({
            user_id: userId,
            lesson_id: lessonId || null,
            game_type: 'capstone_interview',
            score: 0,
            duration_seconds: 0,
            mastery_gain: 0,
            xp_earned: 0,
            completed: false,
            content: initialContent,
            course_id: courseId
          })
          .select()

        if (insertError) {
          console.error('Error creating game session:', insertError)
          return NextResponse.json(
            { error: 'Failed to create game session' },
            { status: 500 }
          )
        }

        gameSessionId = gameSession[0].id
      } catch (dbError) {
        console.error('Error interacting with database:', dbError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }
    } else {
      // For unauthenticated users or when Supabase is not available,
      // generate a temporary session ID
      gameSessionId = 'temp-' + Math.random().toString(36).substring(2, 15)
    }

    // For text interviews, generate the initial message
    if (interviewType === 'text') {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o', // Using GPT-4o for high-quality responses
          messages: [
            {
              role: 'system',
              content: systemPrompt
            }
          ],
          temperature: 0.7,
        })

        const initialMessage = response.choices[0]?.message?.content || 'Welcome to your capstone interview. Let\'s begin discussing the topic.'

        return NextResponse.json({
          sessionId: gameSessionId,
          message: initialMessage,
          interviewType: interviewType
        })
      } catch (openaiError) {
        console.error('Error calling OpenAI API:', openaiError)
        return NextResponse.json({
          error: openaiError instanceof Error ? openaiError.message : 'Failed to get response from OpenAI',
          details: typeof openaiError === 'object' ? openaiError : 'No additional details available'
        }, { status: 500 })
      }
    } 
    // For voice interviews, return session info to be used with the Realtime API
    else if (interviewType === 'voice') {
      return NextResponse.json({
        sessionId: gameSessionId,
        interviewType: 'voice',
        systemPrompt: systemPrompt,
        // The frontend will handle the WebRTC connection with the Realtime API
      })
    }
  } catch (error) {
    console.error('Error processing capstone interview request:', error)

    let errorMessage = 'Failed to process capstone interview request'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * API endpoint to continue an existing capstone interview session
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the user's session from the cookie
    let session;
    try {
      const cookieStore = cookies()
      const supabaseClient = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      )

      const { data } = await supabaseClient.auth.getSession()
      session = data.session
    } catch (authError) {
      console.error('Error getting user session:', authError)
      // Continue without session, we'll handle unauthenticated users
    }

    // Parse the request body
    let body;
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { sessionId, message, interviewHistory = [] } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId and message are required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // Retrieve the game session from the database if it exists
    let gameSession;
    let systemPrompt = '';
    
    if (session?.user && supabase && !sessionId.startsWith('temp-')) {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', session.user.id)
          .single()

        if (error) {
          console.error('Error retrieving game session:', error)
          return NextResponse.json(
            { error: 'Failed to retrieve game session' },
            { status: 404 }
          )
        }

        gameSession = data
        
        // Extract the topic from the content
        const topic = gameSession.content?.topic || 'the subject'
        
        // Create a system prompt based on the game session
        systemPrompt = `You are an expert interviewer conducting a text interview on the topic of "${topic}". 
Your goal is to help the user synthesize and demonstrate their knowledge on this subject.

# Interview Structure
1. Ask thoughtful questions that require the user to synthesize their knowledge.
2. For each response, provide constructive feedback and ask follow-up questions to deepen their understanding.
3. At the end, provide a summary of their strengths and areas for improvement.

# Guidelines
- Ask one question at a time and wait for the user's response.
- Your questions should encourage critical thinking and knowledge synthesis.
- Provide constructive feedback that acknowledges strengths and suggests improvements.
- Maintain a professional and encouraging tone throughout the interview.
- If the user struggles, provide hints or rephrase the question to help them.`
      } catch (dbError) {
        console.error('Error interacting with database:', dbError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }
    } else {
      // For unauthenticated users or temporary sessions,
      // use a generic system prompt
      systemPrompt = `You are an expert interviewer conducting a text interview. 
Your goal is to help the user synthesize and demonstrate their knowledge on the subject.

# Guidelines
- Ask thoughtful questions that require the user to synthesize their knowledge.
- Provide constructive feedback and ask follow-up questions to deepen their understanding.
- Maintain a professional and encouraging tone throughout the interview.`
    }

    // Prepare the messages for the OpenAI API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...interviewHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // Call the OpenAI API
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for high-quality responses
        messages: messages,
        temperature: 0.7,
      })

      const aiResponse = response.choices[0]?.message?.content || 'I\'m having trouble processing your response. Could you try again?'

      // Update the game session in the database if it exists
      if (session?.user && supabase && gameSession) {
        try {
          // Update the content with the new question and response
          const updatedContent = {
            ...gameSession.content,
            questions: [...(gameSession.content.questions || []), aiResponse],
            responses: [...(gameSession.content.responses || []), message]
          }

          // Update the game session
          const { error: updateError } = await supabase
            .from('game_sessions')
            .update({
              content: updatedContent,
              duration_seconds: (gameSession.duration_seconds || 0) + 30, // Approximate time for each exchange
            })
            .eq('id', sessionId)
            .eq('user_id', session.user.id)

          if (updateError) {
            console.error('Error updating game session:', updateError)
            // Continue anyway, as we still have the response to return
          }
        } catch (dbError) {
          console.error('Error interacting with database:', dbError)
          // Continue anyway, as we still have the response to return
        }
      }

      return NextResponse.json({
        response: aiResponse,
        sessionId: sessionId
      })
    } catch (openaiError) {
      console.error('Error calling OpenAI API:', openaiError)
      return NextResponse.json({
        error: openaiError instanceof Error ? openaiError.message : 'Failed to get response from OpenAI',
        details: typeof openaiError === 'object' ? openaiError : 'No additional details available'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing capstone interview request:', error)

    let errorMessage = 'Failed to process capstone interview request'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}