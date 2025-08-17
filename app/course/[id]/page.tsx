'use client'

import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { supabase } from '@/lib/utils/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Star, Lock, Gamepad2, Cat, BrainCircuit, X, MessageCircle, Zap, ChevronRight, Sparkles, TreePine, Leaf, Clock, BookOpen } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ProgressOverlay } from '@/components/ui/progress-overlay'
import { BoardGame } from '@/components/games/the-board'
import { JudgementCat } from '@/components/games/judgement-cat'
import { AdaptiveQuiz } from '@/components/games/adaptive-quiz'
import { Flashcards } from '@/components/games/flashcards'
import { SkillTree, GameModeCard } from '@/app/dashboard/page'
export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id

  const [topic, setTopic] = useState(null)
  const [studyPlan, setStudyPlan] = useState(null)
  const [lessons, setLessons] = useState([])
  const [concepts, setConcepts] = useState([])
  const [skillNodes, setSkillNodes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeGame, setActiveGame] = useState(null)
  const [gameContent, setGameContent] = useState([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameScore, setGameScore] = useState(0)

  // Calculate overall progress
  const calculateProgress = () => {
    if (skillNodes.length === 0) return 0
    const completed = skillNodes.filter(n => n.completed).length
    return (completed / skillNodes.length) * 100
  }

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true)

        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', courseId)
          .maybeSingle()

        if (topicError || !topicData) {
          setError("Course not found")
          setIsLoading(false)
          return
        }

        if (!topicData.is_active) {
          router.push('/dashboard')
          return
        }

        setTopic(topicData)

        const { data: studyPlanData } = await supabase
          .from('study_plans')
          .select('*')
          .eq('topic_id', courseId)
          .maybeSingle()

        setStudyPlan(studyPlanData)

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('study_plan_id', studyPlanData?.id)
          .order('order_index', { ascending: true })

        setLessons(lessonsData || [])

        const { data: conceptsData } = await supabase
          .from('concepts')
          .select('*')
          .eq('topic_id', courseId)

        setConcepts(conceptsData || [])

        await generateSkillTree(lessonsData || [])

      } catch (error) {
        setError("An error occurred while loading the course")
      } finally {
        setIsLoading(false)
      }
    }

    if (courseId) fetchCourseData()
  }, [courseId])

  // Generate skill tree nodes from lessons
  const generateSkillTree = async (lessons) => {
    const gameTypes = ['board', 'judgement-cat', 'adaptive-quiz', 'flashcards', 'chat', 'capstone_interview', 'capstone']
    const nodes = []
    const lessonsPerLevel = Math.ceil(lessons.length / 5)

    const { data: gameSessions } = await supabase
      .from('game_sessions')
      .select('game_type, score, completed')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    const gameScores = new Map()
    if (gameSessions) {
      gameSessions.forEach(session => {
        if (session.completed && session.score && !gameScores.has(session.game_type)) {
          gameScores.set(session.game_type, session.score)
        }
      })
    }

    lessons.forEach((lesson, index) => {
      const level = Math.floor(index / lessonsPerLevel) + 1
      const gameType = lesson.content?.gameType || gameTypes[index % gameTypes.length]
      const score = gameScores.get(gameType)

      nodes.push({
        id: `node-${lesson.id}`,
        title: lesson.title,
        description: lesson.description,
        level,
        gameType,
        hardnessLevel: lesson.content?.hardnessLevel || 'beginner',
        goals: lesson.content?.goals || '',
        lessonId: lesson.id,
        completed: score !== undefined,
        locked: level > 1 && !nodes.some(n => n.level === level - 1 && n.completed),
        score
      })
    })

    setSkillNodes(nodes)
  }

  // Handle node click
  const handleNodeClick = (node) => {
    if (node.locked) return
    setSelectedNode(node)
    setIsPopupOpen(true)
  }

  // Start game
  const startGame = async () => {
    if (!selectedNode) return

    const lesson = lessons.find(l => l.id === selectedNode.lessonId)
    if (!lesson) return

    setGameCompleted(false)
    setGameScore(0)

    if (selectedNode.gameType === 'chat') {
      router.push(`/chat?courseId=${courseId}&lessonId=${selectedNode.lessonId}&topic=${encodeURIComponent(topic?.title || '')}&goals=${encodeURIComponent(selectedNode.goals || '')}`)
      return
    }

    if (selectedNode.gameType === 'capstone_interview') {
      router.push(`/capstone-interview?courseId=${courseId}&lessonId=${selectedNode.lessonId}&topic=${encodeURIComponent(topic?.title || '')}`)
      return
    }

    try {
      setIsGenerating(true)
      setIsPopupOpen(false)

      const response = await fetch('/api/generate-game-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: topic?.title || '',
          courseLevel: `${selectedNode.level} • ${selectedNode.hardnessLevel}`,
          courseDescription: lesson.description,
          sessionGoals: selectedNode.goals,
          gameType: selectedNode.gameType,
          courseId: courseId,
          lessonId: lesson.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGameContent(data.gameContent || [])
        setActiveGame(selectedNode.gameType)
      }

      setIsGenerating(false)
    } catch (error) {
      setIsGenerating(false)
      console.error('Error generating game content:', error)
    }
  }

  // Handle game completion
  const handleGameComplete = (score) => {
    setGameScore(score)
    setGameCompleted(true)

    if (selectedNode) {
      const updatedNodes = skillNodes.map(node => {
        if (node.id === selectedNode.id) {
          return { ...node, completed: true, score }
        }
        if (node.level === selectedNode.level + 1) {
          return { ...node, locked: false }
        }
        return node
      })
      setSkillNodes(updatedNodes)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <TreePine className="w-12 h-12 text-green-600" />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🌳</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            The learning path you're looking for might have been removed or doesn't exist yet.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {topic?.title || 'Course'}
              </h1>
              <div className="w-24" /> {/* Spacer for centering */}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeGame ? (
            // Active game view
            <div className="game-view">
              {gameCompleted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto text-center"
                >
                  <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="text-6xl mb-4"
                    >
                      {gameScore >= 80 ? '🏆' : gameScore >= 60 ? '⭐' : '💪'}
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Great Work!
                    </h2>
                    <p className="text-5xl font-bold text-gray-800 mb-4">{gameScore}%</p>
                    <p className="text-gray-600 mb-6">
                      {gameScore >= 80 ? "Outstanding! You've mastered this topic!" :
                       gameScore >= 60 ? "Good progress! Keep practicing to improve." :
                       "Nice effort! Review the material and try again."}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setGameCompleted(false)}
                      >
                        Try Again
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                        onClick={() => setActiveGame(null)}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div>
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveGame(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Tree
                    </Button>
                  </div>

                  <div className="game-container bg-white rounded-2xl shadow-xl overflow-hidden">
                    {activeGame === 'board' && (
                      <BoardGame
                        concepts={gameContent}
                        onComplete={handleGameComplete}
                      />
                    )}
                    {activeGame === 'judgement-cat' && (
                      <JudgementCat
                        questions={gameContent}
                        onComplete={handleGameComplete}
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
                        onComplete={handleGameComplete}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Skill tree view
            <>
              {/* Course overview card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="bg-white/90 backdrop-blur shadow-xl border-0 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{topic?.title}</CardTitle>
                        <CardDescription className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                            {topic?.difficulty_level.charAt(0).toUpperCase() + topic?.difficulty_level.slice(1)}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            {studyPlan?.estimated_hours} hours
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <BookOpen className="w-4 h-4" />
                            {studyPlan?.total_lessons} lessons
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent">
                          {Math.round(calculateProgress())}%
                        </p>
                        <p className="text-xs text-gray-500">Complete</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{topic?.description}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Interactive Skill Tree */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Your Learning Tree</h2>
                  <p className="text-gray-600">
                    Complete games to grow your knowledge tree. Watch it flourish as you master each topic!
                  </p>
                </div>

                <SkillTree
                  nodes={skillNodes}
                  onNodeClick={handleNodeClick}
                  progress={calculateProgress()}
                />
              </motion.div>

              {/* Game mode popup */}
              <AnimatePresence>
                {isPopupOpen && selectedNode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  >
                    <GameModeCard
                      node={selectedNode}
                      onStart={startGame}
                      onClose={() => setIsPopupOpen(false)}
                    />
                  </motion.div>
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

// Import Target icon that was missing
function Target({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" strokeWidth="2" />
    </svg>
  )
}
