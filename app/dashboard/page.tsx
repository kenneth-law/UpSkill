'use client'

import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { supabase } from '@/lib/utils/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Star, Lock, Gamepad2, Cat, BrainCircuit, X, MessageCircle, Zap, ChevronRight, Sparkles, TreePine, Leaf, Plus } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ProgressOverlay } from '@/components/ui/progress-overlay'
import { Markdown } from '@/components/ui/markdown'
import { BoardGame } from '@/components/games/the-board'
import { JudgementCat } from '@/components/games/judgement-cat'
import { AdaptiveQuiz } from '@/components/games/adaptive-quiz'
import { Flashcards } from '@/components/games/flashcards'

// Game mode   system - consistent with dashboard
const gameColors = {
  board: { primary: '#8B5CF6', secondary: '#A78BFA', bg: '#F3E8FF', light: '#FAF5FF' },
  'judgement-cat': { primary: '#F59E0B', secondary: '#FBBF24', bg: '#FEF3C7', light: '#FFFBEB' },
  'adaptive-quiz': { primary: '#10B981', secondary: '#34D399', bg: '#D1FAE5', light: '#ECFDF5' },
  flashcards: { primary: '#8B5CF6', secondary: '#A78BFA', bg: '#F3E8FF', light: '#FAF5FF' },
  chat: { primary: '#3B82F6', secondary: '#60A5FA', bg: '#DBEAFE', light: '#EFF6FF' },
  capstone: { primary: '#EF4444', secondary: '#F87171', bg: '#FEE2E2', light: '#FEF2F2' },
  capstone_interview: { primary: '#EC4899', secondary: '#F472B6', bg: '#FCE7F3', light: '#FDF2F8' }
}

// Target icon component
function Target({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" strokeWidth="2" />
    </svg>
  )
}

// Animated tree component that grows with progress
export function SkillTree({ nodes, onNodeClick, progress }) {
  const treeRef = useRef(null)
  const [treeHeight, setTreeHeight] = useState(200)

  useEffect(() => {
    // Calculate tree growth based on progress
    const baseHeight = 200
    const maxHeight = 600
    const growthAmount = (maxHeight - baseHeight) * (progress / 100)
    setTreeHeight(baseHeight + growthAmount)
  }, [progress])

  // Group nodes by level
  const nodesByLevel = nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = []
    acc[node.level].push(node)
    return acc
  }, {})

  return (
    <div className="relative w-full min-h-[800px] bg-gradient-to-b from-sky-50 to-green-50 rounded-3xl overflow-hidden p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-300 rounded-full opacity-30"
            style={{
              left: `${20 + i * 15}%`,
              top: `${80 - i * 10}%`
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      {/* Main tree trunk - grows with progress */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
        <motion.div
          className="relative"
          animate={{ height: treeHeight }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Tree trunk */}
          <svg width="80" height={treeHeight} className="absolute -left-10">
            <defs>
              <linearGradient id="trunkGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            <rect
              x="30"
              y="0"
              width="20"
              height={treeHeight}
              fill="url(#trunkGradient)"
              rx="4"
            />
            {/* Tree branches */}
            {[...Array(Math.floor(treeHeight / 100))].map((_, i) => (
              <g key={i}>
                <line
                  x1="30"
                  y1={treeHeight - 100 - i * 100}
                  x2={i % 2 === 0 ? "10" : "70"}
                  y2={treeHeight - 120 - i * 100}
                  stroke="#92400e"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </svg>

          {/* Animated leaves - more leaves based on progress */}
          {progress > 0 && (
            <>
              {/* Top cluster of leaves */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-20 -left-20"
              >
                <div className="relative">
                  {[...Array(Math.min(12, Math.ceil(progress / 10)))].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${Math.cos(i * Math.PI / 6) * 60}px`,
                        top: `${Math.sin(i * Math.PI / 6) * 60}px`
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    >
                      <Leaf 
                        className={`w-8 h-8 ${i % 3 === 0 ? 'text-green-600' : i % 3 === 1 ? 'text-green-500' : 'text-green-400'}`} 
                        fill="currentColor" 
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Middle cluster of leaves (if progress > 30%) */}
              {progress > 30 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-1/3 -right-20"
                >
                  <div className="relative">
                    {[...Array(Math.min(8, Math.ceil((progress - 30) / 10)))].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${Math.cos(i * Math.PI / 4 + Math.PI) * 50}px`,
                          top: `${Math.sin(i * Math.PI / 4 + Math.PI) * 50}px`
                        }}
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, -5, 5, 0]
                        }}
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                      >
                        <Leaf 
                          className={`w-7 h-7 ${i % 3 === 0 ? 'text-green-500' : i % 3 === 1 ? 'text-green-400' : 'text-emerald-500'}`} 
                          fill="currentColor" 
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Lower cluster of leaves (if progress > 60%) */}
              {progress > 60 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="absolute top-2/3 -left-16"
                >
                  <div className="relative">
                    {[...Array(Math.min(10, Math.ceil((progress - 60) / 5)))].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{
                          left: `${Math.cos(i * Math.PI / 5 + Math.PI/2) * 55}px`,
                          top: `${Math.sin(i * Math.PI / 5 + Math.PI/2) * 55}px`
                        }}
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 3, -3, 0]
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                          delay: i * 0.25
                        }}
                      >
                        <Leaf 
                          className={`w-6 h-6 ${i % 4 === 0 ? 'text-green-600' : i % 4 === 1 ? 'text-green-500' : i % 4 === 2 ? 'text-emerald-500' : 'text-green-400'}`} 
                          fill="currentColor" 
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Skill nodes positioned on the tree */}
      <div className="relative z-10">
        {Object.entries(nodesByLevel).map(([level, levelNodes]) => (
          <div
            key={level}
            className="flex justify-center mb-20"
            style={{
              marginTop: level === '1' ? '0' : '60px'
            }}
          >
            <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
              {levelNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: parseInt(level) * 0.2 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={!node.locked ? { scale: 1.1, y: -5 } : {}}
                  whileTap={!node.locked ? { scale: 0.95 } : {}}
                  onClick={() => !node.locked && onNodeClick(node)}
                  className={`relative cursor-pointer ${node.locked ? 'pointer-events-none' : ''}`}
                >
                  {/* Node container */}
                  <div
                    className={`relative w-32 h-32 rounded-2xl shadow-xl transition-all ${
                      node.locked ? 'opacity-60' : 'hover:shadow-2xl'
                    }`}
                    style={{
                      background: node.locked
                        ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
                        : node.completed
                          ? node.score >= 80
                            ? `linear-gradient(135deg, ${gameColors[node.gameType]?.primary || '#10B981'}, ${gameColors[node.gameType]?.secondary || '#34D399'})`
                            : 'linear-gradient(135deg, #FBBF24, #F59E0B)'
                          : `linear-gradient(135deg, ${gameColors[node.gameType]?.primary || '#8B5CF6'}, ${gameColors[node.gameType]?.secondary || '#A78BFA'})`
                    }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm" />

                    <div className="relative h-full flex flex-col items-center justify-center p-3 text-white">
                      {node.locked ? (
                        <Lock className="w-8 h-8" />
                      ) : (
                        <>
                          {getGameIcon(node.gameType)}
                          <p className="text-xs font-bold mt-2 text-center line-clamp-2">
                            {node.title}
                          </p>
                          <p className="text-[10px] opacity-80 mt-1">
                            Level {node.level}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Completion badge */}
                  {node.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg"
                    >
                      {node.score >= 80 ? (
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Star className="w-5 h-5 text-orange-500" />
                      )}
                    </motion.div>
                  )}

                  {/* Progress ring for active nodes */}
                  {!node.locked && !node.completed && (
                    <svg className="absolute inset-0 w-full h-full">
                      <circle
                        cx="64"
                        cy="64"
                        r="62"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        opacity="0.3"
                      />
                    </svg>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress indicator at base of tree */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-white/90 backdrop-blur rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <TreePine className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Tree Growth: {Math.round(progress)}%
            </span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Get game icon based on game type
function getGameIcon(gameType) {
  const icons = {
    board: <Gamepad2 className="w-8 h-8" />,
    'judgement-cat': <Cat className="w-8 h-8" />,
    'adaptive-quiz': <BrainCircuit className="w-8 h-8" />,
    flashcards: <Zap className="w-8 h-8" />,
    capstone: <Trophy className="w-8 h-8" />,
    capstone_interview: <MessageCircle className="w-8 h-8" />,
    chat: <MessageCircle className="w-8 h-8" />
  }
  return icons[gameType] || <Gamepad2 className="w-8 h-8" />
}

// Game mode info card
export function GameModeCard({ node, onStart, onClose }) {
  const colors = gameColors[node.gameType] || gameColors.board

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full"
    >
      {/* Header with gradient */}
      <div
        className="h-32 relative"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur rounded-full p-2 text-white hover:bg-white/30 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 left-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            {getGameIcon(node.gameType)}
            <span className="text-sm font-medium opacity-90">
              {node.gameType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
          </div>
          <h3 className="text-2xl font-bold">{node.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Markdown 
          content={node.description}
          className="text-gray-600 mb-4"
        />

        {/* Metadata */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ backgroundColor: colors.bg }}>
              <Star className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Difficulty</p>
              <p className="font-medium text-gray-800">
                {node.hardnessLevel.charAt(0).toUpperCase() + node.hardnessLevel.slice(1)}
              </p>
            </div>
          </div>

          {node.goals && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: colors.bg }}>
                <Target className="w-5 h-5" style={{ color: colors.primary }} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Session Goals</p>
                <Markdown 
                  content={node.goals}
                  className="text-sm text-gray-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}
        >
          Start Learning
          <ChevronRight className="inline-block w-5 h-5 ml-2" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// Main Dashboard Page Component
export default function DashboardPage() {
  const router = useRouter()
  const [topics, setTopics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [skillNodes, setSkillNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  // Calculate overall progress based on completed nodes
  const calculateOverallProgress = (nodes) => {
    if (!nodes || nodes.length === 0) return 0
    const completedNodes = nodes.filter(node => node.completed)
    return (completedNodes.length / nodes.length) * 100
  }

  // Fetch topics, skill nodes, and user progress on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No authenticated user found')
          setIsLoading(false)
          return
        }

        // Fetch user profile to get sitewide progress
        const { data: userProfile, error: userError } = await supabase
          .from('users_profile')
          .select('sitewide_progress')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user profile:', userError)
        } else if (userProfile) {
          // Use sitewide progress from database if available
          setOverallProgress(userProfile.sitewide_progress || 0)
        }

        // Fetch topics
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('is_active', true)
          .order('title', { ascending: true })

        if (error) throw error
        setTopics(data || [])

        // Generate skill nodes from real data
        const nodes = await generateSkillNodes()
        setSkillNodes(nodes)

        // If no sitewide_progress in database, calculate it from nodes
        if (!userProfile?.sitewide_progress) {
          const progress = calculateOverallProgress(nodes)
          setOverallProgress(progress)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate skill nodes from lessons and game sessions
  const generateSkillNodes = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Fetch all game sessions for the user
      const { data: gameSessions, error: gameSessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (gameSessionsError) {
        console.error('Error fetching game sessions:', gameSessionsError)
        return []
      }

      // Fetch all lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*, study_plans(topic_id)')
        .order('order_index', { ascending: true })

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError)
        return []
      }

      // Create a map of completed game sessions
      const completedSessions = new Map()
      gameSessions?.forEach(session => {
        if (session.completed && session.score) {
          const key = `${session.lesson_id}-${session.game_type}`
          if (!completedSessions.has(key) || session.score > completedSessions.get(key).score) {
            completedSessions.set(key, session)
          }
        }
      })

      // Group lessons by topic
      const lessonsByTopic = lessons?.reduce((acc, lesson) => {
        const topicId = lesson.study_plans?.topic_id
        if (!topicId) return acc

        if (!acc[topicId]) acc[topicId] = []
        acc[topicId].push(lesson)
        return acc
      }, {})

      // Generate nodes for each topic
      const nodes = []
      const gameTypes = ['board', 'judgement-cat', 'adaptive-quiz', 'flashcards', 'chat']

      Object.entries(lessonsByTopic).forEach(([topicId, topicLessons], topicIndex) => {
        // Calculate how many lessons per level
        const lessonsPerLevel = Math.ceil(topicLessons.length / 3)

        topicLessons.forEach((lesson, index) => {
          const level = Math.floor(index / lessonsPerLevel) + 1
          const gameType = lesson.content?.gameType || gameTypes[index % gameTypes.length]

          // Check if this lesson has been completed
          const sessionKey = `${lesson.id}-${gameType}`
          const session = completedSessions.get(sessionKey)

          // Check if previous level has at least one completed lesson
          const previousLevelCompleted = level === 1 || 
            nodes.some(n => n.topicId === topicId && n.level === level - 1 && n.completed)

          nodes.push({
            id: `node-${lesson.id}`,
            title: lesson.title,
            description: lesson.description,
            level,
            gameType,
            topicId,
            lessonId: lesson.id,
            hardnessLevel: lesson.content?.hardnessLevel || 'beginner',
            goals: lesson.content?.goals || 'Master this concept',
            completed: !!session,
            locked: false, // All games unlocked
            score: session?.score || 0
          })
        })
      })

      return nodes
    } catch (error) {
      console.error('Error generating skill nodes:', error)
      return []
    }
  }

  // Handle node click
  const handleNodeClick = (node) => {
    if (node.locked) return
    setSelectedNode(node)
    setIsPopupOpen(true)
  }

  // Start game or course
  const startCourse = () => {
    if (!selectedNode) return
    setIsPopupOpen(false)

    // Navigate to the course page using the topicId
    if (selectedNode.topicId) {
      router.push(`/course/${selectedNode.topicId}`)
    } else if (selectedNode.lessonId) {
      // If we only have lessonId, try to find the associated topic
      const node = skillNodes.find(n => n.id === selectedNode.id)
      if (node && node.topicId) {
        router.push(`/course/${node.topicId}`)
      } else {
        console.error('Could not find topic ID for the selected node')
      }
    } else {
      console.error('No topic or lesson ID found for the selected node')
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-green-50 p-4">
        <header className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Your Learning Dashboard
          </h1>
        </header>

        <main className="max-w-7xl mx-auto px-4">
          <Markdown 
            content="Welcome to your personalised learning dashboard. Select a course to continue your learning journey."
            className="text-gray-600 mb-8"
          />

          {/* Course cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {topics.map((topic) => (
              <Card 
                key={topic.id} 
                className="bg-white hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/course/${topic.id}`)}
              >
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <CardHeader>
                  <CardTitle>{topic.title}</CardTitle>
                  <CardDescription>{topic.difficulty_level}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Markdown 
                    content={topic.description}
                    className="text-sm text-gray-600 line-clamp-2"
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/course/${topic.id}`);
                    }}
                  >
                    Start Learning <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {/* Add Course Card */}
            <Card 
              className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative group border-0"
              onClick={() => router.push('/get-started')}
            >
              {/* Animated background effects */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>

              {/* Floating particles */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full opacity-60"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + i * 10}%`
                  }}
                  animate={{
                    y: [-10, -20, -10],
                    x: [0, 5, 0],
                    opacity: [0.4, 0.7, 0.4]
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}

              <div className="relative h-full flex flex-col items-center justify-center p-6 text-white">
                <motion.div 
                  className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-5 backdrop-blur-sm"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-10 h-10" />
                </motion.div>
                <CardTitle className="text-center mb-3 text-2xl font-bold">Add New Course</CardTitle>
                <Markdown 
                  content="Create your own personalised learning journey"
                  className="text-sm text-center text-white/90 mb-6"
                />
                <Button 
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/40 backdrop-blur-sm group-hover:scale-105 transition-transform"
                >
                  Get Started <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Skill Tree Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Your Learning Tree</h2>
            <Markdown
              content="Track your progress and grow your knowledge tree. Complete activities to unlock new skills!"
              className="text-gray-600 mb-6"
            />

            <SkillTree
              nodes={skillNodes}
              onNodeClick={handleNodeClick}
              progress={overallProgress}
            />
          </div>
        </main>

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
                onStart={startCourse}
                onClose={() => setIsPopupOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}
