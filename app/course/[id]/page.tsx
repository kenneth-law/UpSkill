'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { supabase } from '@/lib/utils/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Star, Lock, Gamepad2, Cat, BrainCircuit, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressOverlay } from '@/components/ui/progress-overlay'
import { BoardGame } from '@/components/games/the-board'
import { JudgementCat } from '@/components/games/judgement-cat'
import { AdaptiveQuiz } from '@/components/games/adaptive-quiz'
import { Flashcards } from '@/components/games/flashcards'

// Define types for our data
type Concept = {
  id: string
  term: string
  definition: string
  importance: number
}

type Lesson = {
  id: string
  study_plan_id: string
  title: string
  description: string
  order_index: number
  content: {
    concepts: string[]
    activities: string[]
    gameType?: string
    goals?: string
    hardnessLevel?: string
  }
  estimated_minutes: number
}

type StudyPlan = {
  id: string
  topic_id: string
  plan_structure: any
  total_lessons: number
  estimated_hours: number
}

type Topic = {
  id: string
  title: string
  description: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
  is_active: boolean
}

// Define game types
type GameType = 'board' | 'judgement-cat' | 'adaptive-quiz' | 'flashcards' | 'capstone' | 'capstone_interview' | 'chat'

// Define node type for skill tree
type SkillNode = {
  id: string
  title: string
  description: string
  level: number
  gameType: GameType
  hardnessLevel: string
  goals: string
  lessonId: string
  completed: boolean
  locked: boolean
  score?: number // Score percentage (0-100)
}

// CSS for text-shadow
const textShadowStyle = {
  textShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)'
};

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [skillNodes, setSkillNodes] = useState<SkillNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [gameContent, setGameContent] = useState<any[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameScore, setGameScore] = useState(0)

  // Using the shared Supabase client from lib/utils/supabase

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true)

        // Fetch topic
        console.log('[DEBUG-CLIENT] Fetching topic with ID:', courseId);

        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', courseId)
          .maybeSingle()

        if (topicError) {
          console.error('[DEBUG-CLIENT] Error fetching topic:', {
            code: topicError.code,
            message: topicError.message,
            details: topicError.details,
            hint: topicError.hint,
            courseId
          });

          // Check for specific error types
          if (topicError.code === 'PGRST116') {
            console.error(`[DEBUG-CLIENT] Topic not found with ID: ${courseId}`);
            setError("Course not found");
            setIsLoading(false);
            return;
          } else if (topicError.code?.startsWith('PGRST')) {
            throw new Error(`Database API error: ${topicError.message}`);
          } else {
            throw new Error(`Failed to fetch topic: ${topicError.message}`);
          }
        }

        if (!topicData) {
          console.error('[DEBUG-CLIENT] Topic not found with ID:', courseId);
          setError("Course not found");
          setIsLoading(false);
          return;
        }

        // Check if the topic is inactive
        if (!topicData.is_active) {
          console.log('[DEBUG-CLIENT] Topic is inactive, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        console.log('[DEBUG-CLIENT] Topic fetched successfully:', {
          id: topicData.id,
          title: topicData.title
        });

        setTopic(topicData)

        // Fetch study plan
        console.log('[DEBUG-CLIENT] Fetching study plan for topic ID:', courseId);

        const { data: studyPlanData, error: studyPlanError } = await supabase
          .from('study_plans')
          .select('*')
          .eq('topic_id', courseId)
          .maybeSingle()

        if (studyPlanError) {
          console.error('[DEBUG-CLIENT] Error fetching study plan:', {
            code: studyPlanError.code,
            message: studyPlanError.message,
            details: studyPlanError.details,
            hint: studyPlanError.hint,
            topicId: courseId
          });

          // Check for specific error types
          if (studyPlanError.code === 'PGRST116') {
            console.error(`[DEBUG-CLIENT] Study plan not found for topic ID: ${courseId}`);
            setError("Study plan not found for this course");
            setIsLoading(false);
            return;
          } else if (studyPlanError.code?.startsWith('PGRST')) {
            throw new Error(`Database API error: ${studyPlanError.message}`);
          } else {
            throw new Error(`Failed to fetch study plan: ${studyPlanError.message}`);
          }
        }

        if (!studyPlanData) {
          console.error('[DEBUG-CLIENT] Study plan not found for topic ID:', courseId);
          setError("Study plan not found for this course");
          setIsLoading(false);
          return;
        }

        console.log('[DEBUG-CLIENT] Study plan fetched successfully:', {
          id: studyPlanData.id,
          totalLessons: studyPlanData.total_lessons
        });

        setStudyPlan(studyPlanData)

        // Fetch lessons
        console.log('[DEBUG-CLIENT] Fetching lessons for study plan ID:', studyPlanData.id);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('study_plan_id', studyPlanData.id)
          .order('order_index', { ascending: true })

        if (lessonsError) {
          console.error('[DEBUG-CLIENT] Error fetching lessons:', {
            code: lessonsError.code,
            message: lessonsError.message,
            details: lessonsError.details,
            hint: lessonsError.hint,
            studyPlanId: studyPlanData.id
          });

          console.error(`[DEBUG-CLIENT] Failed to fetch lessons: ${lessonsError.message}`);
          setError("Could not load lessons for this course");
          setIsLoading(false);
          return;
        }

        console.log('[DEBUG-CLIENT] Lessons fetched successfully:', {
          count: lessonsData?.length || 0
        });

        setLessons(lessonsData || [])

        // Fetch concepts
        console.log('[DEBUG-CLIENT] Fetching concepts for topic ID:', courseId);

        const { data: conceptsData, error: conceptsError } = await supabase
          .from('concepts')
          .select('*')
          .eq('topic_id', courseId)

        if (conceptsError) {
          console.error('[DEBUG-CLIENT] Error fetching concepts:', {
            code: conceptsError.code,
            message: conceptsError.message,
            details: conceptsError.details,
            hint: conceptsError.hint,
            topicId: courseId
          });

          console.error(`[DEBUG-CLIENT] Failed to fetch concepts: ${conceptsError.message}`);
          // Continue without concepts, as they're not critical for the course page
          console.log('[DEBUG-CLIENT] Continuing without concepts');
          setConcepts([]);
        }

        console.log('[DEBUG-CLIENT] Concepts fetched successfully:', {
          count: conceptsData?.length || 0
        });

        setConcepts(conceptsData || [])

        // Generate skill tree nodes
        await generateSkillTree(lessonsData || [])

      } catch (error: any) {
        // Get detailed error information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : String(error);

        console.error('[DEBUG-CLIENT] Error fetching course data:', {
          message: errorMessage,
          stack: errorStack,
          type: error instanceof Error ? error.constructor.name : typeof error,
          courseId
        });

        // Set a user-friendly error message based on the error type
        if (errorMessage.includes('Topic not found')) {
          setError("Course not found");
        } else if (errorMessage.includes('Study plan not found')) {
          setError("Study plan not found for this course");
        } else if (errorMessage.includes('Database API error')) {
          setError("There was a problem connecting to the database. Please try again later.");
        } else {
          setError("An error occurred while loading the course. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (courseId) {
      fetchCourseData()
    }
  }, [courseId])

  // Generate skill tree nodes from lessons
  const generateSkillTree = async (lessons: Lesson[]) => {
    const gameTypes: GameType[] = ['board', 'judgement-cat', 'adaptive-quiz', 'flashcards', 'capstone', 'capstone_interview', 'chat']
    const nodes: SkillNode[] = []

    // Group lessons by level (using order_index to determine level)
    const totalLessons = lessons.length
    const lessonsPerLevel = Math.ceil(totalLessons / 5) // Assuming 5 levels

    // Fetch game sessions for this course
    const { data: gameSessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select('game_type, score, completed')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    // Create a map of game type to score for quick lookup
    const gameScores = new Map<string, number>()
    if (gameSessions && !sessionsError) {
      gameSessions.forEach(session => {
        if (session.completed && session.score && !gameScores.has(session.game_type)) {
          gameScores.set(session.game_type, session.score)
        }
      })
    }

    lessons.forEach((lesson, index) => {
      const level = Math.floor(index / lessonsPerLevel) + 1

      // Use gameType from lesson content if available, otherwise fallback to dynamic assignment
      const gameType = lesson.content.gameType as GameType || gameTypes[index % gameTypes.length]

      // Get hardness level if available
      const hardnessLevel = lesson.content.hardnessLevel || 'beginner'

      // Get goals if available
      const goals = lesson.content.goals || ''

      // Check if this game type has a completed session with a score
      const score = gameScores.get(gameType)
      const completed = score !== undefined

      nodes.push({
        id: `node-${lesson.id}`,
        title: lesson.title,
        description: lesson.description,
        level,
        gameType,
        hardnessLevel,
        goals,
        lessonId: lesson.id,
        completed, // Set to true if there's a completed session for this game type
        locked: false, // All games available for testing
        score // Add the score if available
      })
    })

    setSkillNodes(nodes)
  }

  // Handle node click
  const handleNodeClick = (node: SkillNode) => {
    if (node.locked) return
    setSelectedNode(node)
    setIsPopupOpen(true)
  }

  // Close popup
  const closePopup = () => {
    setIsPopupOpen(false)
  }

  // Start game
  const startGame = async () => {
    if (!selectedNode) return

    // Find the lesson data for the selected node
    const lesson = lessons.find(l => l.id === selectedNode.lessonId)
    if (!lesson) return

    // Find relevant concepts for this lesson
    const lessonConcepts = concepts.filter(c =>
      lesson.content.concepts.includes(c.term) ||
      lesson.content.concepts.includes(c.id)
    )

    // Reset game state
    setGameCompleted(false)
    setGameScore(0)

    // Mark the node as completed and unlock the next level
    const updatedNodes = skillNodes.map(node => {
      if (node.id === selectedNode.id) {
        return { ...node, completed: true }
      }
      if (node.level === selectedNode.level + 1) {
        return { ...node, locked: false }
      }
      return node
    })

    setSkillNodes(updatedNodes)

    // For capstone games, show a message and return
    if (selectedNode.gameType === 'capstone') {
      alert(`${selectedNode.gameType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} game is coming soon!`)
      return
    }

    // For chat games, navigate directly to the chat page
    if (selectedNode.gameType === 'chat') {
      router.push(`/chat?courseId=${courseId}&lessonId=${selectedNode.lessonId}&topic=${encodeURIComponent(topic?.title || '')}&goals=${encodeURIComponent(selectedNode.goals || '')}`)
      return
    }

    // For capstone interview games, navigate directly to the capstone interview page
    if (selectedNode.gameType === 'capstone_interview') {
      router.push(`/capstone-interview?courseId=${courseId}&lessonId=${selectedNode.lessonId}&topic=${encodeURIComponent(topic?.title || '')}`)
      return
    }

    try {
      // Show progress overlay
      setIsGenerating(true)

      // Close the node popup
      setIsPopupOpen(false)

      // Prepare the parameters to send to OpenAI
      const params = {
        courseTitle: topic?.title || '',
        courseLevel: `${selectedNode.level} • ${selectedNode.hardnessLevel}`,
        courseDescription: lesson.description,
        sessionGoals: selectedNode.goals,
        gameType: selectedNode.gameType,
        courseId: courseId,
        lessonId: lesson.id // Add lessonId to differentiate between different games of the same type
      }

      console.log('[DEBUG] Sending parameters to generate game content:', params)

      // Call the API to generate game content
      const response = await fetch('/api/generate-game-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error('Failed to generate game content')
      }

      // Get the game content from the response
      const data = await response.json();

      // Set the game content and active game
      if (data && data.gameContent) {
        setGameContent(data.gameContent);
        setActiveGame(selectedNode.gameType);
      } else {
        // Fallback to mock data if no content is returned
        console.log('[DEBUG] No game content returned, using mock data');

        // Import mock data based on game type
        const { 
          mockBoardQuestions, 
          mockJudgementCatQuestions, 
          mockAdaptiveQuizQuestions,
          mockFlashcards 
        } = await import('@/lib/utils/mock-data');

        switch (selectedNode.gameType) {
          case 'board':
            setGameContent(mockBoardQuestions);
            break;
          case 'judgement-cat':
            setGameContent(mockJudgementCatQuestions);
            break;
          case 'adaptive-quiz':
            setGameContent(mockAdaptiveQuizQuestions);
            break;
          case 'flashcards':
            setGameContent(mockFlashcards);
            break;
          default:
            setGameContent([]);
        }

        setActiveGame(selectedNode.gameType);
      }

      // Hide progress overlay
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating game content:', error)
      // Hide progress overlay
      setIsGenerating(false)
      alert('There was an error preparing the game. Please try again.')
    }
  }

  // Get game icon based on game type
  const getGameIcon = (gameType: GameType) => {
    switch (gameType) {
      case 'board':
        return <Gamepad2 className="w-5 h-5" />
      case 'judgement-cat':
        return <Cat className="w-5 h-5" />
      case 'adaptive-quiz':
        return <BrainCircuit className="w-5 h-5" />
      case 'flashcards':
        return <Star className="w-5 h-5" />
      case 'capstone':
        return <Trophy className="w-5 h-5" />
      case 'capstone_interview':
        return <Trophy className="w-5 h-5" />
      case 'chat':
        return <Cat className="w-5 h-5" />
      default:
        return <Gamepad2 className="w-5 h-5" />
    }
  }

  // Handle game completion
  const handleGameComplete = (score: number) => {
    setGameScore(score);
    setGameCompleted(true);

    // Update the node with the score
    if (selectedNode) {
      const updatedNodes = skillNodes.map(node => {
        if (node.id === selectedNode.id) {
          return { ...node, completed: true, score };
        }
        return node;
      });
      setSkillNodes(updatedNodes);
    }
  }

  // Reset game
  const resetGame = () => {
    setActiveGame(null);
    setGameCompleted(false);
    setGameScore(0);
  }

  // Render the active game
  const renderGame = () => {
    if (gameCompleted) {
      return (
        <div className="max-w-md mx-auto p-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Game Completed!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-indigo-600 mb-4">{gameScore}%</p>
                <p className="mb-4">
                  {gameScore >= 80 ? "Excellent work! You're mastering this topic." :
                   gameScore >= 60 ? "Good job! Keep practicing to improve." :
                   "Nice try! More practice will help you improve."}
                </p>
                <p className="text-sm text-gray-500 italic">
                  Your progress has been saved and will be used to personalize your learning experience.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setGameCompleted(false)}
              >
                Play Again
              </Button>
              <Button 
                className="flex-1"
                onClick={resetGame}
              >
                Return to Course
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={resetGame}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </div>

        <div className="game-container bg-white rounded-lg shadow-md overflow-hidden">
          {activeGame === 'board' && (
            <BoardGame 
              concepts={gameContent}
              onComplete={(score) => handleGameComplete(score)}
            />
          )}

          {activeGame === 'judgement-cat' && (
            <JudgementCat 
              questions={gameContent}
              onComplete={(score) => handleGameComplete(score)}
            />
          )}

          {activeGame === 'adaptive-quiz' && (
            <AdaptiveQuiz 
              questions={gameContent}
              initialMastery={0.3}
              onComplete={(mastery) => handleGameComplete(Math.round(mastery * 100))}
            />
          )}

          {activeGame === 'flashcards' && (
            <Flashcards 
              cards={gameContent}
              onComplete={(score) => handleGameComplete(score)}
            />
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-2xl text-red-500 mb-4">{error}</div>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          The topic you're looking for might have been deleted or doesn't exist.
          Please check the URL or return to the dashboard to see your available topics.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-white to white pb-12">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{topic?.title || 'Course'}</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {activeGame ? (
            // Render the active game
            renderGame()
          ) : (
            // Render the course content
            <>
              {/* Course Info */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{topic?.title}</CardTitle>
                  <CardDescription>
                    {topic?.difficulty_level.charAt(0).toUpperCase() + topic?.difficulty_level.slice(1)} •
                    {studyPlan?.estimated_hours} hours • {studyPlan?.total_lessons} lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{topic?.description}</p>
                </CardContent>
              </Card>

              {/* Skill Tree */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Skill Tree</h2>
                <p className="text-gray-600 mb-6">
                  Complete mini-games to progress through the skill tree. Start from level 1 and unlock higher levels as you complete games.
                </p>

                {/* Skill Tree Visualization */}
                <div className="relative py-8">
                  {/* Level indicators */}
                  <div className="absolute left-0 top-0 bottom-0 w-24 flex flex-col justify-around">
                    {[1, 2, 3, 4, 5].map(level => (
                      <div key={`level-${level}`} className="h-40 flex items-center justify-center">
                        <div className="px-4 py-2 rounded-l-lg shadow-sm font-bold text-gray-700">
                          Level {level}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skill tree nodes by level */}
                  <div className="ml-24">
                    {[1, 2, 3, 4, 5].map((level, index) => (
                      <div
                        key={`level-row-${level}`}
                        className={`mb-12 flex justify-center ${index < 4 ? 'border-b border-gray-200 pb-10' : ''}`}
                      >
                        <div className="flex flex-wrap justify-center gap-8">
                          {skillNodes
                            .filter(node => node.level === level)
                            .map(node => (
                              <motion.div
                                key={node.id}
                                whileHover={!node.locked ? { scale: 1.05 } : {}}
                                whileTap={!node.locked ? { scale: 0.95 } : {}}
                                onClick={() => handleNodeClick(node)}
                                className={`relative cursor-pointer ${node.locked ? 'opacity-50' : ''}`}
                              >
                                <div
                                  className={`w-32 h-40 rounded-lg flex flex-col items-center justify-center shadow-lg p-2
                                    ${node.locked 
                                      ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                                      : node.completed
                                        ? (node.score && node.score >= 80
                                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                                          : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white')
                                        : 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white'}
                                  `}
                                >
                                  {node.locked ? (
                                    <Lock className="w-8 h-8 text-white" />
                                  ) : (
                                    <>
                                      {getGameIcon(node.gameType)}
                                      <div className="text-xs mt-1 font-medium text-white" style={textShadowStyle}>
                                        {node.gameType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                      </div>
                                      <div className="text-xs mt-2 font-bold text-white text-center line-clamp-3" style={textShadowStyle}>
                                        {node.title}
                                      </div>
                                    </>
                                  )}
                                </div>
                                {node.completed && (
                                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-md">
                                    <Star className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popup for Selected Node Details */}
              <AnimatePresence>
                {isPopupOpen && selectedNode && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative w-full max-w-md"
                    >
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-xl overflow-hidden">
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={closePopup}
                            className="bg-white bg-opacity-20 rounded-full p-1 text-white hover:bg-opacity-30 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            {getGameIcon(selectedNode.gameType)}
                            <h3 className="text-xl font-bold" style={textShadowStyle}>{selectedNode.title}</h3>
                          </div>

                          <div className="text-white text-opacity-90 text-sm mb-4" style={textShadowStyle}>
                            {selectedNode.gameType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} •
                            Level {selectedNode.level} •
                            {selectedNode.hardnessLevel.charAt(0).toUpperCase() + selectedNode.hardnessLevel.slice(1)}
                          </div>

                          <p className="text-white text-opacity-90 mb-4" style={textShadowStyle}>{selectedNode.description}</p>

                          {selectedNode.goals && (
                            <div className="mt-2 mb-4">
                              <h3 className="text-sm font-semibold text-white mb-1" style={textShadowStyle}>Session Goals:</h3>
                              <p className="text-sm text-white text-opacity-90" style={textShadowStyle}>{selectedNode.goals}</p>
                            </div>
                          )}

                          <Button
                            onClick={() => {
                              startGame();
                              closePopup();
                            }}
                            className="w-full bg-white text-indigo-600 hover:bg-opacity-90"
                          >
                            Start Game
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>

        {/* Progress Overlay */}
        <ProgressOverlay
          isOpen={isGenerating}
          gameType={selectedNode?.gameType || 'game'}
        />
      </div>
    </ProtectedRoute>
  )
}
