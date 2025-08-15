import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { cookies } from 'next/headers'
import { createClient, Session } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/utils/supabase-server'

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: openaiApiKey,
})

/**
 * Generates the content for a chat message with the AI, including session-specific context
 * @param message The user's message
 * @param topic The topic of the chat session
 * @param goals The goals of the chat session
 * @returns The system prompt and user message for the AI
 */
function generateChatContent(message: string, topic?: string | null, goals?: string | null) {
  // Base system prompt
  let systemPrompt = `You are a cat tutor named :3 who guides students through Socratic dialogue. Your approach is to:
1. Explain concepts clearly and thoroughly
2. Demonstrate with examples when helpful
3. Ask thoughtful follow-up questions that lead students to deeper understanding
4. Maintain a cat-like personality with occasional witty remarks and cat puns
5. Guide rather than simply provide answers - help students discover knowledge themselves
6. Build on previous exchanges to create a coherent learning journey
7. Adjust your explanations based on the student's responses and understanding level`;

  // Add topic-specific context if available
  if (topic) {
    systemPrompt += `\n\nThe current topic is: ${topic}`;
  }

  // Add session goals if available
  if (goals) {
    systemPrompt += `\n\nThe specific goals for this session are: ${goals}\n\nMake sure to guide the conversation toward achieving these goals, while still being responsive to the student's questions and interests.`;
  }

  systemPrompt += `\n\nKeep your tone friendly but with a hint of cat-like attitude. Your goal is to foster deep understanding through dialogue rather than just delivering information.`;

  return {
    systemPrompt,
    userMessage: message
  };
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Only create the client if both URL and key are available
import type { SupabaseClient } from '@supabase/supabase-js'
let supabase: SupabaseClient | undefined
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    // Get the user's session from the cookie
    let session: Session | undefined;
    try {
      const supabaseClient = await createServerSupabaseClient()
      const { data } = await supabaseClient.auth.getSession()
      session = data.session || undefined
    } catch (authError) {
      console.error('Error getting user session:', authError)
      // Continue without session, we'll handle unauthenticated users
    }

    // For testing purposes, we'll allow unauthenticated requests
    // In production, you might want to require authentication
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

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

    const { message, topic, goals, lessonId, courseId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'No message provided' },
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

    // Generate chat content with context
    const chatContent = generateChatContent(message, topic, goals);
    const modelToUse = 'gpt-5-mini-2025-08-07';

    console.log(`Calling OpenAI API with model: ${modelToUse}`)
    console.log('Request payload:', {
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: chatContent.systemPrompt
        },
        {
          role: 'user',
          content: chatContent.userMessage
        }
      ],
      stream: true
    })

    // Calculate a competency score for this interaction
    // This is a simple implementation that increases with each interaction
    // In a real implementation, this would be based on the quality of the user's responses
    const competencyScore = Math.min(100, Math.floor(Math.random() * 30) + 1); // Random score between 1-30 for demo purposes

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        // Send the initial JSON chunk with metadata
        const initialChunk = {
          type: 'metadata',
          competencyScore: competencyScore,
          debug: {
            model: modelToUse,
            timestamp: new Date().toISOString(),
            success: true
          }
        };
        controller.enqueue(new TextEncoder().encode(JSON.stringify(initialChunk) + '\n'));

        try {
          // Call OpenAI API with streaming enabled
          const stream = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
              {
                role: 'system',
                content: chatContent.systemPrompt
              },
              {
                role: 'user',
                content: chatContent.userMessage
              }
            ],
            stream: true
          });

          let fullContent = '';

          // Process each chunk from OpenAI
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              // Send the content chunk to the client
              controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
                type: 'content', 
                content 
              }) + '\n'));
            }
          }

          // Log the chat in the database if user is authenticated and supabase is available
          if (session?.user && supabase) {
            try {
              const userId = session.user.id

              const { error: insertError } = await supabase
                .from('chat_logs')
                .insert({
                  user_id: userId,
                  user_message: message,
                  ai_response: fullContent,
                  created_at: new Date().toISOString(),
                })

              if (insertError) {
                console.error('Error storing chat log:', insertError)
              }
            } catch (dbError) {
              console.error('Error interacting with database:', dbError)
            }
          } else if (session?.user && !supabase) {
            console.warn('Supabase client not initialized, skipping chat logging')
          }

          // Send a completion signal
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ type: 'done' }) + '\n'));
        } catch (error) {
          console.error('Error streaming from OpenAI:', error);
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }) + '\n'));
        } finally {
          controller.close();
        }
      }
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error processing chat request:', error)

    // Ensure we return a proper JSON response even for unexpected errors
    let errorMessage = 'Failed to process chat request'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
