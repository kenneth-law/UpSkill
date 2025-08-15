import OpenAI from 'openai'
import { Concept } from './concept-extraction.service'
import { supabase } from '@/lib/utils/supabase'

// Initialize OpenAI client
console.log('[DEBUG] Initializing OpenAI client in question-generation.service.ts');
console.log('[DEBUG] OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
console.log('[DEBUG] OpenAI API key first 4 chars:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 4) + '...' : 'undefined');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface Question {
  id: string
  text: string
  type: 'mcq' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: number // 0.0-1.0
  conceptId: string
}

export interface QuestionGenerationResult {
  questions: Question[]
}

/**
 * Generates questions based on extracted concepts
 * @param concepts The extracted concepts
 * @param questionTypes Array of question types to generate
 * @param numQuestions Number of questions to generate
 * @returns Promise resolving to the generated questions
 */
export async function generateQuestions(
  concepts: Concept[],
  questionTypes: Array<'mcq' | 'true_false' | 'short_answer'> = ['mcq', 'true_false', 'short_answer'],
  numQuestions: number = 15
): Promise<QuestionGenerationResult> {
  try {
    // Sort concepts by importance
    const sortedConcepts = [...concepts].sort((a, b) => b.importance - a.importance)

    // Take the top concepts based on importance
    const topConcepts = sortedConcepts.slice(0, Math.min(sortedConcepts.length, 15))

    const prompt = `
    You are an expert educator and question designer. Create ${numQuestions} questions based on the following concepts:

    ${topConcepts.map((c, i) => `${i+1}. ${c.term}: ${c.definition} (Importance: ${c.importance}/5)`).join('\n')}

    Create questions of the following types: ${questionTypes.join(', ')}

    Distribution guidelines:
    - For important concepts (4-5 rating), create more questions
    - Distribute question types evenly across concepts
    - Create a mix of difficulty levels

    For each question:
    1. Make it clear and unambiguous
    2. For MCQs, provide 4 options with only one correct answer and plausible distractors
    3. For true/false, ensure it's not too obvious
    4. For short answer, provide a model correct answer that captures key points
    5. Include a detailed explanation of the answer
    6. Assign a difficulty level (0.0-1.0):
       - 0.1-0.3: Basic recall or understanding
       - 0.4-0.6: Application or analysis
       - 0.7-0.9: Synthesis or evaluation
    7. Reference the concept number from the list above

    Format your response as a JSON object with the following structure:
    {
      "questions": [
        {
          "id": "q1",
          "text": "question text",
          "type": "mcq|true_false|short_answer",
          "options": ["option1", "option2", "option3", "option4"], // for MCQs only
          "correctAnswer": "correct answer",
          "explanation": "explanation of the answer",
          "difficulty": 0.5, // 0.0-1.0
          "conceptId": "1" // reference to concept number in the list
        }
      ]
    }
    `

    console.log('[DEBUG] Calling OpenAI API in generateQuestions function (question-generation.service.ts)');
    console.log('[DEBUG] Request payload:', {
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and question designer. Create high-quality questions based on concepts.'
        },
        {
          role: 'user',
          content: 'Prompt length: ' + prompt.length + ' characters' // Don't log full prompt for brevity
        }
      ],
      temperature: 1,
      response_format: { type: 'json_object' }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and question designer. Create high-quality questions based on concepts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1,
      response_format: { type: 'json_object' }
    });

    console.log('[DEBUG] OpenAI API response received in generateQuestions (question-generation.service.ts)');
    console.log('[DEBUG] Response status:', response.choices ? 'Has choices' : 'No choices');
    console.log('[DEBUG] Response object type:', typeof response);
    console.log('[DEBUG] Response object keys:', Object.keys(response));

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    try {
      const rawContent = content;
      let parsed;

      try {
        parsed = JSON.parse(rawContent);
      } catch (err) {
        console.error("Error parsing OpenAI response:", err);
        parsed = {};
      }

      // Ensure questions exists and is an array
      if (!Array.isArray(parsed.questions)) {
        console.error(`Expected 'questions' to be an array, got: ${typeof parsed.questions}`);
        parsed.questions = [];
      }

      const result = parsed as QuestionGenerationResult;

      // Map conceptId from index to actual concept term
      result.questions = result.questions.map(question => {
        const conceptIndex = parseInt(question.conceptId) - 1
        if (conceptIndex >= 0 && conceptIndex < topConcepts.length) {
          return {
            ...question,
            conceptId: topConcepts[conceptIndex].term
          }
        }
        return question
      })

      return result
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      throw new Error('Failed to parse questions result')
    }
  } catch (error) {
    console.error('Error generating questions:', error)
    throw new Error('Failed to generate questions')
  }
}

/**
 * Saves generated questions to the database
 * @param topicId The ID of the topic
 * @param questions The generated questions
 * @returns Promise resolving to the saved questions
 */
export async function saveQuestions(
  topicId: string,
  questions: Question[]
): Promise<Question[]> {
  try {
    // Ensure questions is an array before mapping
    if (!Array.isArray(questions)) {
      console.error(`Expected 'questions' to be an array, got: ${typeof questions}`);
      return [];
    }

    // Format questions for database insertion
    const questionsToInsert = questions.map(question => ({
      topic_id: topicId,
      question_text: question.text,
      question_type: question.type,
      options: question.options ? JSON.stringify(question.options) : null,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      concept_id: null, // We'll need to look up or create the concept
    }))

    // Insert questions into the database
    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (error) {
      console.error('Error saving questions:', error)
      throw new Error('Failed to save questions to database')
    }

    return data as unknown as Question[]
  } catch (error) {
    console.error('Error saving questions:', error)
    throw new Error('Failed to save questions to database')
  }
}

/**
 * Generates questions for different game types
 * @param concepts The extracted concepts
 * @returns Promise resolving to questions categorized by game type
 */
export async function generateGameQuestions(
  concepts: Concept[]
): Promise<{
  boardQuestions: Question[],
  judgementCatQuestions: Question[],
  adaptiveQuizQuestions: Question[]
}> {
  try {
    // Generate matching questions for The Board
    const boardResult = await generateQuestions(
      concepts,
      ['mcq'],
      10
    )

    // Generate short answer questions for Judgement Cat
    const judgementCatResult = await generateQuestions(
      concepts,
      ['short_answer'],
      5
    )

    // Generate mixed questions for Adaptive Quiz
    const adaptiveQuizResult = await generateQuestions(
      concepts,
      ['mcq', 'true_false'],
      20
    )

    // Ensure all question arrays are valid before returning
    const boardQuestions = Array.isArray(boardResult.questions) ? boardResult.questions : [];
    const judgementCatQuestions = Array.isArray(judgementCatResult.questions) ? judgementCatResult.questions : [];
    const adaptiveQuizQuestions = Array.isArray(adaptiveQuizResult.questions) ? adaptiveQuizResult.questions : [];

    // Log warnings if any arrays are missing
    if (!Array.isArray(boardResult.questions)) {
      console.error("Board questions is not an array:", typeof boardResult.questions);
    }
    if (!Array.isArray(judgementCatResult.questions)) {
      console.error("Judgement Cat questions is not an array:", typeof judgementCatResult.questions);
    }
    if (!Array.isArray(adaptiveQuizResult.questions)) {
      console.error("Adaptive Quiz questions is not an array:", typeof adaptiveQuizResult.questions);
    }

    return {
      boardQuestions,
      judgementCatQuestions,
      adaptiveQuizQuestions
    }
  } catch (error) {
    console.error('Error generating game questions:', error)
    throw new Error('Failed to generate game questions')
  }
}

/**
 * Adapts questions for The Board game (matching game)
 * @param questions MCQ questions to adapt
 * @returns Array of term-definition pairs for the matching game
 */
export function adaptQuestionsForBoard(questions: Question[]): Array<{term: string, definition: string}> {
  // Ensure questions is an array before mapping
  if (!Array.isArray(questions)) {
    console.error(`Expected 'questions' to be an array, got: ${typeof questions}`);
    return [];
  }

  return questions.map(question => {
    // For MCQs, use the question as the term and the correct answer as the definition
    return {
      term: question.text,
      definition: question.correctAnswer
    }
  })
}

/**
 * Adapts difficulty of questions based on user performance
 * @param questions Questions to adapt
 * @param userMasteryLevel User's current mastery level (0.0-1.0)
 * @returns Questions sorted by appropriateness for the user's level
 */
export function adaptQuestionDifficulty(
  questions: Question[],
  userMasteryLevel: number
): Question[] {
  // Ensure questions is an array before processing
  if (!Array.isArray(questions)) {
    console.error(`Expected 'questions' to be an array, got: ${typeof questions}`);
    return [];
  }

  // Sort questions by how close their difficulty is to the user's mastery level
  // We want questions that are slightly challenging but not too hard
  return [...questions].sort((a, b) => {
    // Ideal difficulty is slightly above user's mastery level
    const idealDifficulty = Math.min(userMasteryLevel + 0.1, 1.0)

    // Calculate distance from ideal difficulty
    const distanceA = Math.abs(a.difficulty - idealDifficulty)
    const distanceB = Math.abs(b.difficulty - idealDifficulty)

    return distanceA - distanceB
  })
}
