import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Only create the client if both URL and key are available
import type { SupabaseClient } from '@supabase/supabase-js';
let supabase: SupabaseClient | undefined;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * API endpoint to send ICE candidates to OpenAI
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { realtimeSessionId, candidate } = body;

    if (!realtimeSessionId || !candidate) {
      return NextResponse.json(
        { error: 'Missing required parameters: realtimeSessionId and candidate are required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    try {
      // Send ICE candidate to OpenAI using the SDK
      await openai.beta.realtime.sessions.ice(realtimeSessionId, {
        candidate: candidate
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error sending ICE candidate to OpenAI:', error);

      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      } else {
        console.error('Unknown error type:', error);
      }

      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to send ICE candidate to OpenAI',
          details: typeof error === 'object' ? JSON.stringify(error) : 'No additional details available'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing ICE candidate request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process ICE candidate request' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to send WebRTC offers to OpenAI and receive answers
 */
export async function PATCH(request: NextRequest) {
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { realtimeSessionId, sdp } = body;

    if (!realtimeSessionId || !sdp) {
      return NextResponse.json(
        { error: 'Missing required parameters: realtimeSessionId and sdp are required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    try {
      // Send WebRTC offer to OpenAI using the SDK
      const answer = await openai.beta.realtime.sessions.offer(realtimeSessionId, {
        sdp: sdp
      });

      // Return the answer from OpenAI
      const answerData = {
        sdp: answer.sdp
      };
      return NextResponse.json(answerData);
    } catch (error) {
      console.error('Error sending WebRTC offer to OpenAI:', error);

      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      } else {
        console.error('Unknown error type:', error);
      }

      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to send WebRTC offer to OpenAI',
          details: typeof error === 'object' ? JSON.stringify(error) : 'No additional details available'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing WebRTC offer request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process WebRTC offer request' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to create a new realtime voice session
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user's session from the cookie
    let session;
    try {
      const cookieStore = cookies();
      const supabaseClient = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data } = await supabaseClient.auth.getSession();
      session = data.session;
    } catch (authError) {
      console.error('Error getting user session:', authError);
      // Continue without session, we'll handle unauthenticated users
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { topic, systemPrompt, transportMethod = 'websocket' } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Missing required parameter: topic' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Create a default system prompt if none is provided
    const defaultSystemPrompt = `You are an expert interviewer conducting a voice interview on the topic of "${topic}". 
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

Begin the interview by introducing yourself and explaining the purpose of this capstone interview.`;

    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    try {
      // Create a realtime session with OpenAI
      const realtimeSession = await openai.beta.realtime.sessions.create({
        model: 'gpt-4o-realtime-preview'
      });

      // Store the session in the database if user is authenticated
      let gameSessionId;
      if (session?.user && supabase) {
        try {
          const userId = session.user.id;

          // Create initial session content
          const initialContent = {
            topic: topic,
            interviewType: 'voice',
            status: 'started',
            openai_session_id: realtimeSession.id,
          };

          // Insert the game session
          const { data: gameSession, error: insertError } = await supabase
            .from('game_sessions')
            .insert({
              user_id: userId,
              game_type: 'capstone_interview',
              score: 0,
              duration_seconds: 0,
              mastery_gain: 0,
              xp_earned: 0,
              completed: false,
              content: initialContent,
              course_id: 'realtime-voice',
            })
            .select();

          if (insertError) {
            console.error('Error creating game session:', insertError);
            // Continue anyway, we still have the OpenAI session
          } else {
            gameSessionId = gameSession[0].id;
          }
        } catch (dbError) {
          console.error('Error interacting with database:', dbError);
          // Continue anyway, we still have the OpenAI session
        }
      } else {
        // For unauthenticated users or when Supabase is not available,
        // generate a temporary session ID
        gameSessionId = 'temp-' + Math.random().toString(36).substring(2, 15);
      }

      // Return the session information
      return NextResponse.json({
        sessionId: gameSessionId || 'temp-session',
        realtimeSessionId: realtimeSession.id,
        expiresAt: realtimeSession.expires_at,
      });
    } catch (openaiError) {
      console.error('Error creating OpenAI realtime session:', openaiError);

      // Log more detailed error information
      if (openaiError instanceof Error) {
        console.error('Error details:', {
          message: openaiError.message,
          name: openaiError.name,
          stack: openaiError.stack,
        });
      } else {
        console.error('Unknown error type:', openaiError);
      }

      return NextResponse.json({
        error: openaiError instanceof Error ? openaiError.message : 'Failed to create OpenAI realtime session',
        details: typeof openaiError === 'object' ? JSON.stringify(openaiError) : 'No additional details available',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing realtime voice request:', error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      return NextResponse.json(
        { 
          error: error.message,
          details: 'Check server logs for more information'
        },
        { status: 500 }
      );
    } else {
      console.error('Unknown error type:', error);

      return NextResponse.json(
        { 
          error: 'Failed to process realtime voice request',
          details: typeof error === 'object' ? JSON.stringify(error) : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}
