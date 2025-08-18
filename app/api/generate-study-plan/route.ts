import { NextRequest, NextResponse } from 'next/server'
import { generateStudyPlan, extractConcepts } from '@/lib/services/concept-extraction.service'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '@/lib/supabase/server'

// Define interfaces for type safety
interface Lesson {
  title: string;
  description: string;
  concepts: any[];
  activities: any[];
  gameType?: string;
  goals?: string[];
  hardnessLevel?: string;
  estimatedMinutes?: number;
}

interface StudyPlan {
  totalLessons: number;
  lessons: Lesson[];
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[DEBUG-SERVER] Missing Supabase credentials. URL:', !!supabaseUrl, 'Service Key:', !!supabaseServiceKey);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to validate Supabase client
async function validateSupabaseConnection() {
  try {
    // Simple query to check if connection works
    const { data, error } = await supabase.from('topics').select('id').limit(1);

    if (error) {
      console.error('[DEBUG-SERVER] Supabase connection test failed:', error);
      return false;
    }

    console.log('[DEBUG-SERVER] Supabase connection test successful');
    return true;
  } catch (e) {
    console.error('[DEBUG-SERVER] Error testing Supabase connection:', e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG-SERVER] Starting study plan generation API request');

    // Validate Supabase connection before proceeding
    const isSupabaseConnected = await validateSupabaseConnection();
    if (!isSupabaseConnected) {
      console.error('[DEBUG-SERVER] Cannot proceed with study plan generation due to database connection issues');
      throw new Error('Database connection failed. Please try again later.');
    }

    // Get the user's session from cookies
    let userId;
    try {
      // Create a Supabase client that can access cookies
      const supabaseClient = await createServerClient();

      // Get the user's session
      const { data } = await supabaseClient.auth.getSession();

      if (data.session?.user) {
        userId = data.session.user.id;
        console.log('[DEBUG-SERVER] Retrieved user ID from session:', userId);
      } else {
        console.log('[DEBUG-SERVER] No authenticated user session found');
      }
    } catch (authError) {
      console.error('[DEBUG-SERVER] Error getting user session:', authError);
      // Continue without session, we'll check if userId is in the request body
    }

    const body = await request.json()
    console.log('[DEBUG-SERVER] Request body received:', {
      hasTopic: !!body.topic,
      hasExtractedText: !!body.extractedText,
      frequency: body.frequency,
      duration: body.duration,
      masteryDepth: body.masteryDepth,
      studySpan: body.studySpan,
      courseLength: body.courseLength,
      ageGroup: body.ageGroup
    });

    // If userId wasn't found in the session, try to get it from the request body
    if (!userId && body.userId) {
      userId = body.userId;
      console.log('[DEBUG-SERVER] Using user ID from request body:', userId);
    }

    // Validate userId is available
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please sign in.' },
        { status: 400 }
      )
    }

    const { topic, frequency, duration, masteryDepth, studySpan, courseLength, ageGroup, extractedText } = body

    // Validate required fields
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Check if a pre-built study plan was provided
    if (body.studyPlan) {
      console.log('[DEBUG] Using provided study plan');

      // Generate a unique ID for the topic
      const topicId = uuidv4();

      // Insert the topic into the database
      console.log('[DEBUG-SERVER] Inserting pre-built topic into database with ID:', topicId, 'for user:', userId);
      const { error: topicError } = await supabase
        .from('topics')
        .insert({
          id: topicId,
          user_id: userId, // Using the userId retrieved from session or request body
          title: body.studyPlan.title,
          description: body.studyPlan.description,
          difficulty_level: body.studyPlan.lessons[0]?.hardnessLevel || 'beginner',
          is_active: true
        });

      if (topicError) {
        console.error('Error inserting topic:', topicError);
        throw new Error('Failed to save topic to database');
      }

      // Generate a unique ID for the study plan
      const studyPlanId = uuidv4();

      // Insert the study plan into the database
      const { error: studyPlanError } = await supabase
        .from('study_plans')
        .insert({
          id: studyPlanId,
          topic_id: topicId,
          plan_structure: body.studyPlan,
          total_lessons: body.studyPlan.totalLessons,
          estimated_hours: Math.ceil(body.studyPlan.lessons.reduce((total: number, lesson: Lesson) => total + (lesson.estimatedMinutes || 0), 0) / 60)
        });

      if (studyPlanError) {
        console.error('Error inserting study plan:', studyPlanError);
        throw new Error('Failed to save study plan to database');
      }

      // Insert lessons into the database
      const lessonInserts = body.studyPlan.lessons.map((lesson: Lesson, index: number) => ({
        study_plan_id: studyPlanId,
        title: lesson.title,
        description: lesson.description,
        order_index: index,
        content: {
          concepts: lesson.concepts,
          activities: lesson.activities,
          gameType: lesson.gameType,
          goals: lesson.goals,
          hardnessLevel: lesson.hardnessLevel
        },
        estimated_minutes: Math.round(lesson.estimatedMinutes || 0)
      }));

      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonInserts);

      if (lessonsError) {
        console.error('Error inserting lessons:', lessonsError);
        throw new Error('Failed to save lessons to database');
      }

      // Return the IDs needed for redirection
      return NextResponse.json({
        success: true,
        topicId,
        studyPlanId
      });
    }

    // If no pre-built study plan was provided, generate one from the topic
    // Extract concepts from the topic and any additional text
    const textToProcess = extractedText
      ? `${topic}\n\n${extractedText}`
      : topic

    // Step 1: Extract concepts from the text
    console.log('[DEBUG-SERVER] Starting concept extraction for:', topic.substring(0, 50) + '...');
    let conceptExtractionResult;
    try {
      conceptExtractionResult = await extractConcepts(textToProcess);
      console.log('[DEBUG-SERVER] Concept extraction completed successfully. Found concepts:',
        conceptExtractionResult.result.concepts?.length || 0);
    } catch (extractionError) {
      console.error('[DEBUG-SERVER] Error during concept extraction:', extractionError);
      throw new Error(`Concept extraction failed: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}`);
    }

    // Ensure conceptExtractionResult is properly initialized
    if (!conceptExtractionResult || !conceptExtractionResult.result) {
      console.error('[DEBUG-SERVER] Concept extraction result is invalid or missing');
      throw new Error('Concept extraction result is invalid or missing');
    }

    // Check if concepts array is empty or undefined
    if (!conceptExtractionResult.result.concepts || conceptExtractionResult.result.concepts.length === 0) {
      console.log('[DEBUG] No concepts found in extraction result. Using fallback concepts.');
      // Add fallback concepts to ensure we have something to work with
      conceptExtractionResult.result.concepts = [
        {
          term: "Fallback Concept 1",
          definition: "This is a fallback concept for " + topic,
          importance: 5
        },
        {
          term: "Fallback Concept 2",
          definition: "This is another fallback concept for " + topic,
          importance: 4
        }
      ];
    }

    // Step 2: Generate a study plan based on the extracted concepts
    const timeConstraint = parseInt(frequency) * parseInt(duration) / 7 // Average minutes per day

    console.log('[DEBUG-SERVER] Starting study plan generation with time constraint:', timeConstraint, 'minutes per day');
    let studyPlan;
    try {
      studyPlan = await generateStudyPlan(
        conceptExtractionResult.result.concepts,
        `Learn ${topic} with mastery level ${masteryDepth}/100`,
        timeConstraint,
        masteryDepth,
        studySpan,
        false, // returnPrompt parameter
        ageGroup
      );
      console.log('[DEBUG-SERVER] Study plan generation completed successfully. Total lessons:',
        studyPlan.result.totalLessons || studyPlan.result.lessons?.length || 0);
    } catch (studyPlanError) {
      console.error('[DEBUG-SERVER] Error during study plan generation:', studyPlanError);
      throw new Error(`Study plan generation failed: ${studyPlanError instanceof Error ? studyPlanError.message : String(studyPlanError)}`);
    }

    // Ensure studyPlan is properly initialized
    if (!studyPlan || !studyPlan.result) {
      console.error('[DEBUG-SERVER] Study plan result is invalid or missing');
      throw new Error('Study plan result is invalid or missing');
    }

    // Generate a unique ID for the topic
    const topicId = uuidv4();

    // Insert the topic into the database
    console.log('[DEBUG-SERVER] Inserting topic into database with ID:', topicId, 'for user:', userId);
    const { error: topicError } = await supabase
      .from('topics')
      .insert({
        id: topicId,
        user_id: userId, // Using the userId retrieved from session or request body
        title: topic,
        description: conceptExtractionResult.result.summary,
        difficulty_level: conceptExtractionResult.result.difficulty,
        is_active: true
      });

    if (topicError) {
      console.error('[DEBUG-SERVER] Error inserting topic:', topicError);
      throw new Error(`Failed to save topic to database: ${topicError.message}`);
    }
    console.log('[DEBUG-SERVER] Topic inserted successfully');

    // Generate a unique ID for the study plan
    const studyPlanId = uuidv4();

    // Insert the study plan into the database
    console.log('[DEBUG-SERVER] Inserting study plan into database with ID:', studyPlanId);
    const totalLessons = studyPlan.result.totalLessons || studyPlan.result.lessons?.length || 0;
    const estimatedMinutes = studyPlan.result.lessons?.reduce((total: number, lesson: Lesson) => total + (lesson.estimatedMinutes || 0), 0) || 0;
    const estimatedHours = Math.ceil(estimatedMinutes / 60);

    console.log('[DEBUG-SERVER] Study plan details:', {
      totalLessons,
      estimatedMinutes,
      estimatedHours,
      hasLessons: !!studyPlan.result.lessons && studyPlan.result.lessons.length > 0
    });

    const { error: studyPlanError } = await supabase
      .from('study_plans')
      .insert({
        id: studyPlanId,
        topic_id: topicId,
        plan_structure: studyPlan.result,
        total_lessons: totalLessons,
        estimated_hours: estimatedHours
      });

    if (studyPlanError) {
      console.error('[DEBUG-SERVER] Error inserting study plan:', studyPlanError);
      throw new Error(`Failed to save study plan to database: ${studyPlanError.message}`);
    }
    console.log('[DEBUG-SERVER] Study plan inserted successfully');

    // Insert lessons into the database if they exist
    if (studyPlan.result.lessons && studyPlan.result.lessons.length > 0) {
      console.log('[DEBUG-SERVER] Inserting lessons into database. Total lessons:', studyPlan.result.lessons.length);

      try {
        const lessonInserts = studyPlan.result.lessons.map((lesson: Lesson, index: number) => {
          // Log each lesson's basic structure to help identify any problematic data
          console.log(`[DEBUG-SERVER] Preparing lesson ${index + 1}:`, {
            title: lesson.title?.substring(0, 30) + '...',
            hasDescription: !!lesson.description,
            conceptsCount: lesson.concepts?.length || 0,
            activitiesCount: lesson.activities?.length || 0,
            estimatedMinutes: lesson.estimatedMinutes,
            roundedMinutes: Math.round(lesson.estimatedMinutes || 0)
          });

          return {
            study_plan_id: studyPlanId,
            title: lesson.title,
            description: lesson.description,
            order_index: index,
            content: {
              concepts: lesson.concepts,
              activities: lesson.activities,
              gameType: lesson.gameType,
              goals: lesson.goals,
              hardnessLevel: lesson.hardnessLevel
            },
            estimated_minutes: Math.round(lesson.estimatedMinutes || 0)
          };
        });

        console.log('[DEBUG-SERVER] Sending lessons to database...');
        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonInserts);

        if (lessonsError) {
          console.error('[DEBUG-SERVER] Error inserting lessons:', lessonsError);
          throw new Error(`Failed to save lessons to database: ${lessonsError.message}`);
        }
        console.log('[DEBUG-SERVER] Lessons inserted successfully');
      } catch (lessonProcessingError) {
        console.error('[DEBUG-SERVER] Error processing lessons for database insertion:', lessonProcessingError);
        throw new Error(`Failed to process lessons for database: ${lessonProcessingError instanceof Error ? lessonProcessingError.message : String(lessonProcessingError)}`);
      }
    } else {
      console.log('[DEBUG-SERVER] No lessons to insert into database');
    }

    // Insert concepts into the database
    console.log('[DEBUG-SERVER] Inserting concepts into database. Total concepts:', conceptExtractionResult.result.concepts.length);

    try {
      const conceptInserts = conceptExtractionResult.result.concepts.map((concept, index) => {
        // Log a sample of concepts to help identify any problematic data
        if (index < 3 || index === conceptExtractionResult.result.concepts.length - 1) {
          console.log(`[DEBUG-SERVER] Concept ${index + 1}:`, {
            term: concept.term?.substring(0, 30) + (concept.term?.length > 30 ? '...' : ''),
            definitionLength: concept.definition?.length || 0,
            importance: concept.importance
          });
        }

        return {
          topic_id: topicId,
          term: concept.term,
          definition: concept.definition,
          importance: concept.importance
        };
      });

      console.log('[DEBUG-SERVER] Sending concepts to database...');
      const { error: conceptsError } = await supabase
        .from('concepts')
        .insert(conceptInserts);

      if (conceptsError) {
        console.error('[DEBUG-SERVER] Error inserting concepts:', conceptsError);
        // Continue anyway, as we still have the topic and study plan saved
        console.log('[DEBUG-SERVER] Continuing despite concept insertion error');
      } else {
        console.log('[DEBUG-SERVER] Concepts inserted successfully');
      }
    } catch (conceptProcessingError) {
      console.error('[DEBUG-SERVER] Error processing concepts for database insertion:', conceptProcessingError);
      // Continue anyway, as we still have the topic and study plan saved
      console.log('[DEBUG-SERVER] Continuing despite concept processing error');
    }

    // Return the combined result with IDs for redirection
    console.log('[DEBUG-SERVER] Study plan generation completed successfully. Returning response with topicId:', topicId);

    // Prepare the response data
    const responseData = {
      success: true,
      topicId,
      studyPlanId,
      conceptExtractionResult: conceptExtractionResult.result,
      studyPlan: studyPlan.result
    };

    // Log a summary of the response (without the full data which could be very large)
    console.log('[DEBUG-SERVER] Response summary:', {
      success: responseData.success,
      topicId: responseData.topicId,
      studyPlanId: responseData.studyPlanId,
      hasConceptExtractionResult: !!responseData.conceptExtractionResult,
      hasStudyPlan: !!responseData.studyPlan
    });

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[DEBUG-SERVER] Error generating study plan:', error);

    // Get detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : String(error);

    // Log detailed error information
    console.error('[DEBUG-SERVER] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    // Include the actual error message in the response for better debugging
    console.log('[DEBUG-SERVER] Returning error response to client');
    return NextResponse.json(
      {
        error: 'Failed to generate study plan',
        message: errorMessage,
        details: errorStack
      },
      { status: 500 }
    );
  }
}
