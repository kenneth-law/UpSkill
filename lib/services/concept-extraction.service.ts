import OpenAI from 'openai'
import { ExtractionResult } from './pdf-extraction.service'
import { z } from "zod"

// Initialize OpenAI client
console.log('[DEBUG] Initializing OpenAI client in concept-extraction.service.ts');
console.log('[DEBUG] OpenAI API key exists:', !!process.env.OPENAI_API_KEY);
console.log('[DEBUG] OpenAI API key first 4 chars:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 4) + '...' : 'undefined');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Zod schema for runtime validation
const Concept = z.object({
  term: z.string(),
  definition: z.string(),
  importance: z.number().min(1).max(5)
});

const ConceptsResponse = z.object({
  concepts: z.array(Concept),
  summary: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedStudyTimeMinutes: z.number().optional()
});

export interface Concept {
  term: string
  definition: string
  importance: number // 1-5 scale
}

export interface ConceptExtractionResult {
  concepts: Concept[]
  summary: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedStudyTimeMinutes: number
}

/**
 * Extracts key concepts from text using OpenAI's API
 * @param text The text to extract concepts from
 * @param maxConcepts Maximum number of concepts to extract
 * @returns Promise resolving to the extracted concepts
 */
export async function extractConcepts(
  text: string,
  maxConcepts: number = 20,
  returnPrompt: boolean = false
): Promise<{ result: ConceptExtractionResult, prompt?: string }> {
  try {
    // Truncate text if it's too long (OpenAI has token limits)
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...' : text

    const prompt = `Return JSON only. Include 5–10 items. Your response must include a "concepts" array with objects containing "term", "definition", and "importance" fields, as well as "summary", "difficulty" (one of: "beginner", "intermediate", "advanced"), and "estimatedStudyTimeMinutes" fields at the top level.

Important formatting guidelines:
- Use proper markdown formatting in your definitions and summary
- Use LaTeX for mathematical expressions and formulas, enclosed in $ for inline math and $$ for block math
- Examples of LaTeX usage:
  - Inline math: $E = mc^2$
  - Block math: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
  - Fractions: $\\frac{a}{b}$
  - Square roots: $\\sqrt{x}$
  - Subscripts and superscripts: $x_i^2$
  - Greek letters: $\\alpha, \\beta, \\gamma, \\delta$

Text:\n${truncatedText}`

    console.log('[DEBUG] Calling OpenAI API in extractConcepts function');
    console.log('[DEBUG] Request payload:', {
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and knowledge extractor. Extract key concepts from the user text.'
        },
        {
          role: 'user',
          content: 'Prompt length: ' + prompt.length + ' characters' // Don't log full prompt for brevity
        }
      ],
      temperature: 1, // Using default temperature of 1 as 'gpt-5-mini-2025-08-07' only supports this value
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "concepts_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["concepts", "summary", "difficulty", "estimatedStudyTimeMinutes"],
            properties: {
              concepts: {
                type: "array",
                minItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["term", "definition", "importance"],
                  properties: {
                    term: { type: "string" },
                    definition: { type: "string" },
                    importance: { type: "number", minimum: 1, maximum: 5 }
                  }
                }
              },
              summary: { type: "string" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              estimatedStudyTimeMinutes: { type: "number", minimum: 1 }
            }
          },
          strict: true
        }
      }
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and knowledge extractor. Extract key concepts from the user text. Use proper markdown formatting and LaTeX for mathematical expressions and formulas. For LaTeX, use $ for inline math and $$ for block math.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1, // Using default temperature of 1 as 'gpt-5-mini-2025-08-07' only supports this value
      // Prefer structured outputs if your SDK supports it:
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "concepts_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["concepts", "summary", "difficulty", "estimatedStudyTimeMinutes"],
            properties: {
              concepts: {
                type: "array",
                minItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["term", "definition", "importance"],
                  properties: {
                    term: { type: "string" },
                    definition: { type: "string" },
                    importance: { type: "number", minimum: 1, maximum: 5 }
                  }
                }
              },
              summary: { type: "string" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              estimatedStudyTimeMinutes: { type: "number", minimum: 1 }
            }
          },
          strict: true
        }
      }
      // If your current SDK/model doesn't support json_schema on your account,
      // fall back to: response_format: { type: "json_object" }
    });

    console.log('[DEBUG] OpenAI API response received in extractConcepts');
    console.log('[DEBUG] Response status:', response.choices ? 'Has choices' : 'No choices');
    console.log('[DEBUG] Response object type:', typeof response);
    console.log('[DEBUG] Response object keys:', Object.keys(response));

    const raw = response.choices?.[0]?.message?.content ?? "";
    console.log('[DEBUG] Raw response content:', raw.slice(0, 200) + (raw.length > 200 ? '...' : ''));

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
      console.log('[DEBUG] Successfully parsed JSON. Object keys:', Object.keys(parsed as object));
      if ((parsed as any).concepts) {
        console.log('[DEBUG] Concepts array length:', (parsed as any).concepts.length);
      } else {
        console.log('[DEBUG] No concepts array found in parsed JSON');
      }
    } catch (e) {
      console.error("Failed to JSON.parse model output:", raw.slice(0, 400));
      console.log('[DEBUG] Using fallback concepts');
      // Instead of throwing, use fallback data
      parsed = {
        concepts: [
          {
            term: "Fallback Concept 1",
            definition: "This is a fallback concept due to JSON parsing error",
            importance: 5
          },
          {
            term: "Fallback Concept 2",
            definition: "This is another fallback concept due to JSON parsing error",
            importance: 4
          }
        ],
        summary: "Fallback summary due to JSON parsing error",
        difficulty: "beginner",
        estimatedStudyTimeMinutes: 30
      };
    }

    // Runtime validation (guards you even if schema isn't enforced server-side)
    const safe = ConceptsResponse.safeParse(parsed);
    if (!safe.success) {
      console.error("Schema validation failed:", safe.error.flatten());
      console.log('[DEBUG] Using fallback concepts due to schema validation failure');
      // Instead of throwing, use fallback data
      return {
        result: {
          concepts: [
            {
              term: "Fallback Concept 1",
              definition: "This is a fallback concept due to schema validation error",
              importance: 5
            },
            {
              term: "Fallback Concept 2",
              definition: "This is another fallback concept due to schema validation error",
              importance: 4
            }
          ],
          summary: "Fallback summary due to schema validation error",
          difficulty: "beginner",
          estimatedStudyTimeMinutes: 30
        }
      };
    }

    // Create a validated result with all required fields
    const validatedResult: ConceptExtractionResult = {
      concepts: safe.data.concepts,
      summary: safe.data.summary || "Extracted concepts from text",
      difficulty: safe.data.difficulty || "beginner",
      estimatedStudyTimeMinutes: safe.data.estimatedStudyTimeMinutes || 30
    };

    return returnPrompt 
      ? { result: validatedResult, prompt }
      : { result: validatedResult }
  } catch (error) {
    console.error('Error extracting concepts:', error)

    const defaultResult = {
      concepts: [],
      summary: 'Failed to extract concepts',
      difficulty: 'beginner',
      estimatedStudyTimeMinutes: 0
    };

    return returnPrompt 
      ? { result: defaultResult, prompt: 'Error extracting concepts from text' }
      : { result: defaultResult }
  }
}

/**
 * Processes a PDF extraction result to extract concepts
 * @param extractionResult The result from PDF extraction
 * @param maxConcepts Maximum number of concepts to extract
 * @returns Promise resolving to the extracted concepts
 */
export async function processExtractedContent(
  extractionResult: ExtractionResult,
  maxConcepts: number = 20,
  returnPrompt: boolean = false
): Promise<{ result: ConceptExtractionResult, prompt?: string }> {
  return await extractConcepts(extractionResult.text, maxConcepts, returnPrompt)
}

/**
 * Generates a study plan based on extracted concepts
 * @param concepts The extracted concepts
 * @param targetOutcome The desired learning outcome
 * @param timeConstraint Time constraint in minutes per day
 * @param masteryDepth How in-depth the user wants to master the topic (1-100)
 * @param studySpan How long the user wants the study plan to span (in days)
 * @param ageGroup The age group for which the study plan is being created
 * @returns Promise resolving to the generated study plan
 */
export async function generateStudyPlan(
  concepts: Concept[],
  targetOutcome: string,
  timeConstraint: number = 30,
  masteryDepth: number = 50,
  studySpan: number = 30,
  returnPrompt: boolean = false,
  ageGroup: string = '13-16'
): Promise<{ result: any, prompt?: string }> {
  try {
    if (!Array.isArray(concepts) || concepts.length === 0) {
      // Return a 400/500 from the API instead of rendering a page with undefined
      throw new Error("No concepts available to build a study plan");
    }

    const conceptsBlock = concepts
      .map(c => `- ${c.term}: ${c.definition} (Importance: ${c.importance}/5)`)
      .join('\n');

    const prompt = `
    You are an expert educator and learning designer. Create a structured study plan based on the following concepts:

    ${conceptsBlock}

    Target outcome: ${targetOutcome}
    Time constraint: ${timeConstraint} minutes per day
    Mastery depth: ${masteryDepth}/100 (higher values indicate deeper mastery)
    Study duration: ${studySpan} days
    Age group: ${ageGroup} (tailor the content and approach to this age group)

    Important formatting guidelines:
    - Use proper markdown formatting in your descriptions and goals
    - Use LaTeX for mathematical expressions and formulas, enclosed in $ for inline math and $$ for block math
    - Examples of LaTeX usage:
      - Inline math: $E = mc^2$
      - Block math: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$
      - Fractions: $\\frac{a}{b}$
      - Square roots: $\\sqrt{x}$
      - Subscripts and superscripts: $x_i^2$
      - Greek letters: $\\alpha, \\beta, \\gamma, \\delta$

    Create a study plan that:
    1. Groups related concepts together
    2. Presents concepts in a logical learning sequence
    3. Breaks down the material into manageable daily sessions
    4. Includes review sessions and practice activities
    5. Builds toward the target outcome
    6. Adjusts depth of coverage based on the mastery depth (${masteryDepth}/100)
    7. Fits within the specified study duration of ${studySpan} days
    8. INCLUDES THE 'chat' GAME TYPE IN EACH LESSON to provide conversational learning
    9. USES THE 'capstone_interview' GAME TYPE FOR THE FINAL LESSON instead of 'capstone' if the target outcome is a human language, or when it make sense to use voice
    10. USES THE 'capstone' GAME TYPE FOR THE FINAL LESSON if the target outcome is a non-language, technical, written content heavy, math-based or when it make sense to use text

    IMPORTANT: For each session in the study plan, you MUST include:
    1. A game type that MUST be one of these 7 options ONLY:
       - 'board': A board game-style learning activity
       - 'judgement-cat': A judgment and categorization exercise
       - 'adaptive-quiz': An adaptive quiz that adjusts to the learner's knowledge level
       - 'flashcards': A flashcard-based memory and recall exercise
       - 'capstone': A comprehensive project that applies multiple concepts
       - 'capstone_interview': An interview-style assessment of comprehensive knowledge
       - 'chat': A conversational learning session with an AI tutor
    2. A short paragraph outlining the specific goals for that session
    3. A hardness level that MUST be one of: 'beginner', 'intermediate', or 'advanced'

    You MUST format your response as a JSON object with EXACTLY the following structure:
    {
      "title": "Study Plan Title",
      "description": "Brief description of the overall study plan",
      "totalLessons": number_of_lessons,
      "estimatedDays": estimated_days_to_complete,
      "lessons": [
        {
          "title": "Lesson title",
          "description": "Detailed lesson description",
          "concepts": ["concept1", "concept2"],
          "activities": ["activity1", "activity2"],
          "estimatedMinutes": minutes_to_complete,
          "gameType": "board|judgement-cat|adaptive-quiz|flashcards|capstone|capstone_interview|chat",
          "goals": "A short paragraph outlining the specific goals for this session",
          "hardnessLevel": "beginner|intermediate|advanced"
        }
      ]
    }

    IMPORTANT NOTES:
    - You MUST use ONLY the 7 game types listed above. Do not invent new game types.
    - The "gameType" field MUST be exactly one of: "board", "judgement-cat", "adaptive-quiz", "flashcards", "capstone", "capstone_interview", or "chat".
    - CRITICAL: EVERY COURSE SHOULD START WITH THE FLASHCARD as it is the easiest, use a diverse range of lessons in between, and the FINAL lesson MUST use "capstone_interview" instead of "capstone".
    - The "hardnessLevel" field MUST be exactly one of: "beginner", "intermediate", or "advanced".
    - Ensure all JSON fields are properly formatted and match the template exactly.
    - The response MUST be valid JSON that can be parsed without errors.
    `

    console.log('[DEBUG] Calling OpenAI API in generateStudyPlan function');
    console.log('[DEBUG] Request payload:', {
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator and learning designer. Create structured study plans based on concepts...'
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
          content: 'You are an expert educator and learning designer. Create structured study plans based on concepts. You MUST use ONLY the 7 game types specified in the prompt: "board", "judgement-cat", "adaptive-quiz", "flashcards", "capstone", "capstone_interview", and "chat". IMPORTANT: Include "chat" in EACH lesson and use "capstone_interview" for the FINAL lesson. Use proper markdown formatting and LaTeX for mathematical expressions and formulas. For LaTeX, use $ for inline math and $$ for block math. Your response MUST follow the exact JSON template provided, with all required fields and proper formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1,
      response_format: { type: 'json_object' }
    });

    console.log('[DEBUG] OpenAI API response received in generateStudyPlan');
    console.log('[DEBUG] Response status:', response.choices ? 'Has choices' : 'No choices');
    console.log('[DEBUG] Response object type:', typeof response);
    console.log('[DEBUG] Response object keys:', Object.keys(response));

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    try {
      const result = JSON.parse(content)
      return returnPrompt 
        ? { result, prompt }
        : { result }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      throw new Error('Failed to parse study plan result')
    }
  } catch (error) {
    console.error('Error generating study plan:', error)
    return returnPrompt 
      ? { result: {}, prompt: 'Error generating study plan' }
      : { result: {} }
  }
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
  numQuestions: number = 10
): Promise<any> {
  try {
    // Validate concepts is an array
    if (!Array.isArray(concepts) || concepts.length === 0) {
      throw new Error("No concepts available to generate questions");
    }

    // Sort concepts by importance
    const sortedConcepts = [...concepts].sort((a, b) => b.importance - a.importance)

    // Take the top concepts based on importance
    const topConcepts = sortedConcepts.slice(0, Math.min(sortedConcepts.length, 10))

    // Ensure topConcepts is an array before mapping
    if (!Array.isArray(topConcepts) || topConcepts.length === 0) {
      throw new Error("No top concepts available to generate questions");
    }

    const conceptsBlock = topConcepts
      .map(c => `- ${c.term}: ${c.definition} (Importance: ${c.importance}/5)`)
      .join('\n');

    const prompt = `
    You are an expert educator and question designer. Create ${numQuestions} questions based on the following concepts:

    ${conceptsBlock}

    Create questions of the following types: ${questionTypes.join(', ')}

    For each question:
    1. Make it clear and unambiguous
    2. For MCQs, provide 4 options with only one correct answer
    3. For true/false, ensure it's not too obvious
    4. For short answer, provide a model correct answer
    5. Include an explanation of the answer
    6. Assign a difficulty level (0.0-1.0)

    Important formatting guidelines:
    - Use proper markdown formatting in your questions, answers, and explanations
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
      "questions": [
        {
          "id": "unique_id",
          "text": "question text",
          "type": "mcq|true_false|short_answer",
          "options": ["option1", "option2", "option3", "option4"], // for MCQs
          "correctAnswer": "correct answer",
          "explanation": "explanation of the answer",
          "difficulty": 0.5, // 0.0-1.0
          "conceptId": "related concept"
        }
      ]
    }
    `

    console.log('[DEBUG] Calling OpenAI API in generateQuestions function (concept-extraction.service.ts)');
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
          content: 'You are an expert educator and question designer. Create high-quality questions based on concepts. Use proper markdown formatting and LaTeX for mathematical expressions and formulas. For LaTeX, use $ for inline math and $$ for block math.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1,
      response_format: { type: 'json_object' }
    });

    console.log('[DEBUG] OpenAI API response received in generateQuestions (concept-extraction.service.ts)');
    console.log('[DEBUG] Response status:', response.choices ? 'Has choices' : 'No choices');
    console.log('[DEBUG] Response object type:', typeof response);
    console.log('[DEBUG] Response object keys:', Object.keys(response));

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    try {
      const result = JSON.parse(content)
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
