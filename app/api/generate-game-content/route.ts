import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/utils/supabase'
import { v4 as uuidv4 } from 'uuid'
import { generateQuestions } from '@/lib/services/question-generation.service'
import { Concept } from '@/lib/services/concept-extraction.service'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * API endpoint to generate game content based on course parameters
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { 
      courseTitle, 
      courseLevel, 
      courseDescription, 
      sessionGoals, 
      gameType,
      courseId,
      lessonId
    } = body

    console.log('[DEBUG] Generating game content for:', {
      courseTitle,
      courseLevel,
      courseDescription,
      sessionGoals,
      gameType,
      courseId,
      lessonId
    })

    // Validate required fields
    if (!courseTitle || !courseLevel || !courseDescription || !gameType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if a game session already exists for this course, game type, and lesson
    if (courseId) {
      const query = supabase
        .from('game_sessions')
        .select('content, concepts')
        .eq('course_id', courseId)
        .eq('game_type', gameType)
        .order('created_at', { ascending: false })
        .limit(1);

      // Add lessonId filter if provided to differentiate between different games of the same type
      if (lessonId) {
        query.eq('lesson_id', lessonId);
      }

      const { data: existingSession, error: sessionError } = await query.maybeSingle();

      if (!sessionError && existingSession && existingSession.content) {
        console.log('[DEBUG] Found existing game session, reusing content')
        return NextResponse.json({ 
          gameContent: existingSession.content, 
          concepts: existingSession.concepts 
        })
      }
    }

    // Generate concepts from course parameters using OpenAI
    const concepts = await generateConceptsFromParameters(
      courseTitle,
      courseLevel,
      courseDescription,
      sessionGoals
    )

    // Generate game content based on concepts and game type
    let gameContent
    switch (gameType) {
      case 'board':
        gameContent = await generateBoardContent(concepts)
        break
      case 'judgement-cat':
        gameContent = await generateJudgementCatContent(concepts)
        break
      case 'adaptive-quiz':
        gameContent = await generateAdaptiveQuizContent(concepts)
        break
      case 'flashcards':
        gameContent = await generateFlashcardsContent(concepts)
        break
      case 'capstone':
        // For capstone, we'll just return the concepts as is
        gameContent = concepts
        break
      case 'capstone_interview':
        // For capstone_interview, we'll just return the concepts as is
        gameContent = concepts
        break
      case 'chat':
        // For chat, we'll just return the concepts as is
        gameContent = concepts
        break
      default:
        return NextResponse.json(
          { error: 'Invalid game type' },
          { status: 400 }
        )
    }

    // Store game content in database if courseId is provided
    if (courseId) {
      await storeGameContent(courseId, gameType, gameContent, concepts, lessonId)
    }

    return NextResponse.json({ gameContent, concepts })
  } catch (error) {
    console.error('Error generating game content:', error)
    return NextResponse.json(
      { error: 'Failed to generate game content' },
      { status: 500 }
    )
  }
}

/**
 * Generate concepts from course parameters using OpenAI
 */
async function generateConceptsFromParameters(
  courseTitle: string,
  courseLevel: string,
  courseDescription: string,
  sessionGoals: string
): Promise<Concept[]> {
  try {
    const prompt = `
    You are an expert educator and curriculum designer. Extract key concepts from the following course information:

    Course Title: ${courseTitle}
    Level: ${courseLevel}
    Description: ${courseDescription}
    Session Goals: ${sessionGoals}

    Identify 5-10 key concepts that should be covered in this course. For each concept:
    1. Provide a clear term
    2. Write a concise but comprehensive definition
    3. Rate its importance on a scale of 1-5 (5 being most important)

    Important formatting guidelines:
    - Use proper markdown formatting in your definitions
    - Use LaTeX for mathematical expressions and formulas, enclosed in $ for inline math and $$ for block math
    - Examples of LaTeX usage:
      - Inline math: $E = mc^2$
      - Block math: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
      - Fractions: $\\frac{a}{b}$
      - Square roots: $\\sqrt{x}$
      - Subscripts and superscripts: $x_i^2$
      - Greek letters: $\\alpha, \\beta, \\gamma, \\delta$

    Format your response as a JSON object with the following structure:
    {
      "concepts": [
        {
          "term": "concept name",
          "definition": "detailed definition",
          "importance": 5
        }
      ]
    }
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and curriculum designer. Extract key concepts from course information. Use proper markdown formatting and LaTeX for mathematical expressions and formulas. For LaTeX, use $ for inline math and $$ for block math.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const parsed = JSON.parse(content)
    return parsed.concepts
  } catch (error) {
    console.error('Error generating concepts:', error)
    throw new Error('Failed to generate concepts')
  }
}

/**
 * Generate content for the Board game
 */
async function generateBoardContent(concepts: Concept[]) {
  const result = await generateQuestions(concepts, ['mcq'], 10)
  return result.questions.map(question => ({
    term: question.text,
    definition: question.correctAnswer
  }))
}

/**
 * Generate content for the Judgement Cat game
 */
async function generateJudgementCatContent(concepts: Concept[]) {
  // Generate short answer questions for Judgement Cat
  const result = await generateQuestions(
    concepts,
    ['short_answer'],
    5
  )
  return result.questions
}

/**
 * Generate content for the Adaptive Quiz game
 */
async function generateAdaptiveQuizContent(concepts: Concept[]) {
  const result = await generateQuestions(concepts, ['mcq', 'true_false'], 20)
  return result.questions
}

/**
 * Generate content for the Flashcards game
 */
async function generateFlashcardsContent(concepts: Concept[]) {
  try {
    const prompt = `
    You are an expert educator and flashcard designer. Create flashcards based on the following concepts:

    ${concepts.map((c, i) => `${i+1}. ${c.term}: ${c.definition} (Importance: ${c.importance}/5)`).join('\n')}

    Create 8-10 flashcards that cover these concepts. For each flashcard:
    1. Create a clear question for the front
    2. Provide a concise but comprehensive answer for the back
    3. Assign a category based on the concept area

    Important formatting guidelines:
    - For the front and back of the card, use proper markdown formatting
    - When listing items, put each item on a new line with proper spacing
    - For numbered lists, format as:
      (1) First item
      (2) Second item
      (3) Third item
    - Keep content concise but ensure proper formatting for readability
    - Ensure paragraphs have proper spacing between them
    - Use LaTeX for mathematical expressions and formulas, enclosed in $ for inline math and $$ for block math
    - Examples of LaTeX usage:
      - Inline math: $E = mc^2$
      - Block math: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
      - Fractions: $\\frac{a}{b}$
      - Square roots: $\\sqrt{x}$
      - Subscripts and superscripts: $x_i^2$
      - Greek letters: $\\alpha, \\beta, \\gamma, \\delta$

    Format your response as a JSON object with the following structure:
    {
      "flashcards": [
        {
          "id": "fc1",
          "front": "question text",
          "back": "answer text with proper formatting",
          "category": "category name"
        }
      ]
    }
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and flashcard designer. Create high-quality flashcards based on concepts. Use proper markdown formatting for content, especially for lists and paragraphs. Use LaTeX for mathematical expressions and formulas, enclosed in $ for inline math and $$ for block math. Keep content concise but ensure proper formatting for readability.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const parsed = JSON.parse(content)
    return parsed.flashcards
  } catch (error) {
    console.error('Error generating flashcards:', error)
    throw new Error('Failed to generate flashcards')
  }
}

/**
 * Store game content in database
 */
async function storeGameContent(
  courseId: string,
  gameType: string,
  gameContent: any,
  concepts: Concept[],
  lessonId?: string
) {
  try {
    const gameSessionId = uuidv4()

    // Store game session
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        id: gameSessionId,
        course_id: courseId,
        game_type: gameType,
        content: gameContent,
        concepts: concepts,
        lesson_id: lessonId, // Include lessonId to differentiate between different games of the same type
        created_at: new Date().toISOString()
      })

    if (sessionError) {
      console.error('Error storing game session:', sessionError)
      throw new Error('Failed to store game session')
    }

    return gameSessionId
  } catch (error) {
    console.error('Error storing game content:', error)
    throw new Error('Failed to store game content')
  }
}
