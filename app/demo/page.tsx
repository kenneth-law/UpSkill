'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BoardGame } from '@/components/games/the-board'
import { JudgementCat } from '@/components/games/judgement-cat'
import { AdaptiveQuiz } from '@/components/games/adaptive-quiz'
import { Flashcards } from '@/components/games/flashcards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Gamepad2, 
  Cat, 
  BrainCircuit, 
  Home,
  BookOpen,
  Star
} from 'lucide-react'
import { 
  mockBoardQuestions, 
  mockJudgementCatQuestions, 
  mockAdaptiveQuizQuestions,
  mockFlashcards,
  mockConcepts
} from '@/lib/utils/mock-data'

type GameType = 'board' | 'judgement-cat' | 'adaptive-quiz' | 'flashcards' | 'capstone' | 'capstone_interview' | 'chat' | null

export default function DemoPage() {
  const [activeGame, setActiveGame] = useState<GameType>(null)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [gameContent, setGameContent] = useState<any>(null)
  const router = useRouter()

  // Check for game parameter, course ID, and lesson ID in URL
  const [courseId, setCourseId] = useState<string | null>(null)
  const [lessonId, setLessonId] = useState<string | null>(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const gameParam = searchParams.get('game')
    const courseParam = searchParams.get('courseId')
    const lessonParam = searchParams.get('lessonId')

    if (courseParam) {
      setCourseId(courseParam)
    }

    if (lessonParam) {
      setLessonId(lessonParam)
    }

    if (gameParam && (gameParam === 'board' || gameParam === 'judgement-cat' || gameParam === 'adaptive-quiz' || gameParam === 'flashcards' || gameParam === 'capstone' || gameParam === 'capstone_interview' || gameParam === 'chat')) {
      setActiveGame(gameParam as GameType)

      // Fetch game content if we have both game type and course ID
      if (courseParam) {
        fetchGameContent(gameParam as GameType, courseParam, lessonParam)
      }
    }
  }, [])

  // Fetch game content from the database
  const fetchGameContent = async (gameType: GameType, courseId: string, lessonId: string | null) => {
    try {
      setIsLoading(true)

      // Build the URL with query parameters
      let url = `/api/game-sessions?courseId=${courseId}&gameType=${gameType}`;

      // Add lessonId parameter if provided to differentiate between different games of the same type
      if (lessonId) {
        url += `&lessonId=${lessonId}`;
      }

      // Fetch the most recent game session for this course, game type, and lesson
      const response = await fetch(url);

      if (!response.ok) {
        // If we can't find a game session, use mock data
        console.log('[DEBUG] No game session found, using mock data')
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data && data.gameContent) {
        console.log('[DEBUG] Game content loaded from database:', data.gameContent)
        setGameContent(data.gameContent)
      }
    } catch (error) {
      console.error('Error fetching game content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGameComplete = (gameScore: number) => {
    setScore(gameScore)
    setGameCompleted(true)
  }

  const resetGame = () => {
    setActiveGame(null)
    setGameCompleted(false)
    setScore(0)
  }

  const renderGameSelection = () => (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">UpSkill Demo</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Biology Fundamentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This demo showcases three learning games from UpSkill using biology concepts.
            Choose a game below to try it out!
          </p>
          <p className="text-sm text-gray-500 italic">
            In the full application, these games would be part of a personalized study plan
            generated from your own content.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GameCard 
          title="The Board" 
          description="Match concepts with their definitions in this memory game."
          icon={<Gamepad2 className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('board')}
        />

        <GameCard 
          title="Judgement Cat" 
          description="Test your knowledge with short answers judged by our sarcastic cat."
          icon={<Cat className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('judgement-cat')}
        />

        <GameCard 
          title="Adaptive Quiz" 
          description="Questions that adapt to your skill level for optimal learning."
          icon={<BrainCircuit className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('adaptive-quiz')}
        />

        <GameCard 
          title="Flashcards" 
          description="Flip through flashcards to test your memory with the cat watching your progress."
          icon={<Star className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('flashcards')}
        />

        <GameCard 
          title="Capstone Project" 
          description="Apply multiple concepts in a comprehensive project."
          icon={<Star className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('capstone')}
        />

        <GameCard 
          title="Capstone Interview" 
          description="Demonstrate your knowledge in an interview-style assessment."
          icon={<Cat className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('capstone_interview')}
        />

        <GameCard 
          title="Chat Session" 
          description="Learn through conversation with an AI tutor."
          icon={<BrainCircuit className="w-8 h-8 text-indigo-600" />}
          onClick={() => setActiveGame('chat')}
        />
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This is a demo of UpSkill running in demo mode.</p>
        <p>No API keys or external services are required.</p>
      </div>
    </div>
  )

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
                <p className="text-4xl font-bold text-indigo-600 mb-4">{score}%</p>
                <p className="mb-4">
                  {score >= 80 ? "Excellent work! You're mastering this topic." :
                   score >= 60 ? "Good job! Keep practicing to improve." :
                   "Nice try! More practice will help you improve."}
                </p>
                <p className="text-sm text-gray-500 italic">
                  In the full application, your progress would be tracked and used to
                  personalize your learning experience.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              {courseId ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setGameCompleted(false)}
                  >
                    Play Again
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => router.push(`/course/${courseId}`)}
                  >
                    Return to Course
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={resetGame}
                  >
                    Try Another Game
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setGameCompleted(false)}
                  >
                    Play Again
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )
    }

    return (
      <div className="p-4">
        <div className="flex gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={resetGame}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Game Selection
          </Button>

          {courseId && (
            <Button 
              variant="secondary"
              onClick={() => router.push(`/course/${courseId}`)}
            >
              Return to Course
            </Button>
          )}
        </div>

        <div className="game-container bg-white rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-xl">Loading game content...</div>
            </div>
          ) : (
            <>
              {activeGame === 'board' && (
                <BoardGame 
                  concepts={gameContent?.length > 0 ? gameContent : mockBoardQuestions}
                  onComplete={(score) => handleGameComplete(score)}
                />
              )}

              {activeGame === 'judgement-cat' && (
                <JudgementCat 
                  questions={gameContent?.length > 0 ? gameContent : mockJudgementCatQuestions}
                  onComplete={(score) => handleGameComplete(score)}
                />
              )}

              {activeGame === 'adaptive-quiz' && (
                <AdaptiveQuiz 
                  questions={gameContent?.length > 0 ? gameContent : mockAdaptiveQuizQuestions}
                  initialMastery={0.3}
                  onComplete={(mastery) => handleGameComplete(Math.round(mastery * 100))}
                />
              )}

              {activeGame === 'flashcards' && (
                <Flashcards 
                  cards={gameContent?.length > 0 ? gameContent : mockFlashcards}
                  onComplete={(score) => handleGameComplete(score)}
                />
              )}

              {activeGame === 'capstone' && (
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Capstone Project</h2>
                  <p className="mb-6">This is a placeholder for the Capstone Project game mode.</p>
                  <p className="mb-6">In the full application, this would be a comprehensive project that applies multiple concepts.</p>
                  <button 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    onClick={() => handleGameComplete(85)}
                  >
                    Complete Capstone Project
                  </button>
                </div>
              )}

              {activeGame === 'capstone_interview' && (
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Capstone Interview</h2>
                  <p className="mb-6">This is a placeholder for the Capstone Interview game mode.</p>
                  <p className="mb-6">In the full application, this would be an interview-style assessment of comprehensive knowledge.</p>
                  <button 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    onClick={() => handleGameComplete(90)}
                  >
                    Complete Capstone Interview
                  </button>
                </div>
              )}

              {activeGame === 'chat' && (
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">Chat Session</h2>
                  <p className="mb-6">This is a placeholder for the Chat game mode.</p>
                  <p className="mb-6">In the full application, this would be a conversational learning session with an AI tutor.</p>
                  <button 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    onClick={() => handleGameComplete(80)}
                  >
                    Complete Chat Session
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      {activeGame ? renderGame() : renderGameSelection()}
    </main>
  )
}

interface GameCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

function GameCard({ title, description, icon, onClick }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="h-full cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClick}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
