'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import styles from './styles.module.css'
import { useAuth } from '@/lib/auth/auth-provider'
import { Markdown } from '@/components/ui/markdown'

// Game mode color system
const gameColors = {
  flashcards: { primary: '#8B5CF6', secondary: '#A78BFA', bg: '#EDE9FE' },
  judgementCat: { primary: '#F59E0B', secondary: '#FBBF24', bg: '#FEF3C7' },
  adaptiveQuiz: { primary: '#10B981', secondary: '#34D399', bg: '#D1FAE5' },
  chat: { primary: '#3B82F6', secondary: '#60A5FA', bg: '#DBEAFE' },
  capstone: { primary: '#EF4444', secondary: '#F87171', bg: '#FEE2E2' }
}

// Custom 3D floating orb component
function FloatingOrb({ color, size, position, delay = 0 }) {
  return (
    <motion.div
      className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-70"
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        width: size,
        height: size,
        ...position
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 20, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// Animated counter component
function AnimatedCounter({ end, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / (duration * 1000)

      if (progress < 1) {
        setCount(Math.floor(end * progress))
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count.toLocaleString()}{suffix}</span>
}

// Learning path visualization component
function LearningPathVisualization() {
  const pathRef = useRef(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [])

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      <motion.path
        ref={pathRef}
        d="M 50 250 Q 100 200 150 220 T 250 180 Q 300 150 350 100"
        stroke="url(#pathGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Milestone nodes */}
      {[
        { x: 50, y: 250, color: gameColors.flashcards.primary },
        { x: 150, y: 220, color: gameColors.judgementCat.primary },
        { x: 250, y: 180, color: gameColors.adaptiveQuiz.primary },
        { x: 350, y: 100, color: gameColors.capstone.primary }
      ].map((node, i) => (
        <motion.g key={i}>
          <motion.circle
            cx={node.x}
            cy={node.y}
            r="8"
            fill={node.color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.2 }}
          />
          <motion.circle
            cx={node.x}
            cy={node.y}
            r="12"
            fill="none"
            stroke={node.color}
            strokeWidth="2"
            opacity="0.3"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ delay: 0.5 + i * 0.2, duration: 2, repeat: Infinity }}
          />
        </motion.g>
      ))}
    </svg>
  )
}

// Interactive game card component
function GameCard({ game, index }) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)

  return (
    <motion.div
      ref={cardRef}
      className="relative"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Color accent bar */}
        <div
          className="h-2 w-full"
          style={{ background: `linear-gradient(90deg, ${game.color.primary}, ${game.color.secondary})` }}
        />

        {/* Interactive preview area */}
        <div
          className="relative h-48 overflow-hidden"
          style={{ backgroundColor: game.color.bg }}
        >
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {game.preview}
              </motion.div>
            )}
          </AnimatePresence>

          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {game.icon}
              </motion.div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{game.title}</h3>
          <Markdown 
            content={game.description}
            className="text-gray-600 mb-4 text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: game.color.bg,
                  color: game.color.primary
                }}
              >
                {game.difficulty}
              </span>
              <span className="text-xs text-gray-500">{game.duration}</span>
            </div>

            <motion.button
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: game.color.bg }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" style={{ color: game.color.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { scrollY } = useScroll()
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 500], [0, -50])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const games = [
    {
      title: 'Smart Flashcards',
      description: 'AI-powered spaced repetition cards that adapt to your learning pace',
      icon: <CardIcon />,
      preview: <FlashcardPreview />,
      color: gameColors.flashcards,
      difficulty: 'Adaptive',
      duration: '5-10 min'
    },
    {
      title: 'Judgement Cat',
      description: 'Test your knowledge with our sarcastic feline mentor',
      icon: <CatIcon />,
      preview: <JudgementCatPreview />,
      color: gameColors.judgementCat,
      difficulty: 'Challenging',
      duration: '10-15 min'
    },
    {
      title: 'Adaptive Quiz',
      description: 'Dynamic questions that evolve with your understanding',
      icon: <BrainIcon />,
      preview: <QuizPreview />,
      color: gameColors.adaptiveQuiz,
      difficulty: 'Progressive',
      duration: '15-20 min'
    },
    {
      title: 'AI Mentor Chat',
      description: 'Socratic dialogue with your personal AI tutor',
      icon: <ChatIcon />,
      preview: <ChatPreview />,
      color: gameColors.chat,
      difficulty: 'Supportive',
      duration: 'Flexible'
    },
    {
      title: 'Capstone Interview',
      description: 'Demonstrate mastery through comprehensive assessment',
      icon: <TrophyIcon />,
      preview: <CapstonePreview />,
      color: gameColors.capstone,
      difficulty: 'Advanced',
      duration: '20-30 min'
    }
  ]

  const testimonials = [
    {
      quote: "The cat is great!",
      author: "Sophie Xu",
      role: "Software Engineering and Commerce Student",
      avatar: "SX"
    },
    {
      quote: "Finally, an AI tool that helps students learn instead of doing the work for them.",
      author: "Omar Salem",
      role: "Software Engineering Student",
      avatar: "OS"
    },
    {
      quote: "I actually enjoy learning now! And no more putting on subway surfer on the side just to retain knowledge!",
      author: "Kenneth Law",
      role: "Another gen z student",
      avatar: "KL"
    },
    {
      quote: "Actually having a structure is so much better than just blindly asking chatgpt stuff when trying to study!",
      author: "Ajax",
      role: "Year 7 student",
      avatar: "A"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingOrb color="#8B5CF6" size="400px" position={{ top: '-100px', left: '-100px' }} />
        <FloatingOrb color="#3B82F6" size="300px" position={{ top: '50%', right: '-50px' }} delay={2} />
        <FloatingOrb color="#10B981" size="350px" position={{ bottom: '-100px', left: '30%' }} delay={4} />
      </div>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center px-4"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="max-w-6xl mx-auto text-center z-10">
          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-lg mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Trusted by <AnimatedCounter end={5} suffix="+" /> students</span>
          </motion.div>

          {/* Main heading with gradient */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Master Any Subject
            </span>
            <br />
            <span className="text-gray-900">With AI That Cares</span>
          </motion.h1>

          <motion.div
            className="max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Markdown
              content="Turn overwhelming information into lasting knowledge through personalised, gamified micro-learning powered by AI that adapts to you."
              className="text-xl text-gray-600"
            />
          </motion.div>

          {/* CTA buttons with hover effects */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href={user ? "/dashboard" : "/login"}>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Start Learning Free
              </motion.button>
            </Link>

            <motion.button
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-md border border-gray-200"
              whileHover={{ scale: 1.05, backgroundColor: "#F9FAFB" }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center gap-2">
                <PlayIcon />
                Watch Demo
              </span>
            </motion.button>
          </motion.div>

          {/* Learning path visualization */}
          <motion.div
            className="mt-20 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <LearningPathVisualization />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.section>

      {/* Problem Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">The Learning Crisis</h2>
            <Markdown
              content="AI is making students dependent, not intelligent"
              className="text-xl text-gray-600"
            />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: '73%',
                label: 'of students use AI to complete homework',
                trend: 'up',
                icon: <ChartUpIcon />
              },
              {
                stat: '61%',
                label: 'show decreased problem-solving skills',
                trend: 'down',
                icon: <ChartDownIcon />
              },
              {
                stat: '89%',
                label: 'worry about AI dependency',
                trend: 'neutral',
                icon: <AlertIcon />
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-gray-900">{item.stat}</span>
                  <span className={`p-3 rounded-lg ${
                    item.trend === 'up' ? 'bg-red-100 text-red-600' :
                    item.trend === 'down' ? 'bg-orange-100 text-orange-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {item.icon}
                  </span>
                </div>
                <Markdown
                  content={item.label}
                  className="text-gray-600"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Journey Map Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Your Learning Journey</h2>
            <Markdown
              content="Follow these simple steps to transform how you learn with UpSkill"
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            />
          </motion.div>

          <div className="relative">
            {/* Journey path line - horizontal for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform -translate-y-1/2 z-0 md:mt-20">
              {/* Animated dots moving along the path */}
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-white shadow-md"
                style={{ top: '-4px' }}
                animate={{
                  x: ['0%', '100%'],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-white shadow-md"
                style={{ top: '-4px' }}
                animate={{
                  x: ['0%', '100%'],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 2
                }}
              />
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-white shadow-md"
                style={{ top: '-4px' }}
                animate={{
                  x: ['0%', '100%'],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 4
                }}
              />
            </div>

            {/* Journey path line - vertical for mobile */}
            <div className="md:hidden absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 z-0">
              {/* Animated dots moving along the path */}
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-white shadow-md"
                style={{ left: '-4px' }}
                animate={{
                  y: ['0%', '100%'],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.div
                className="absolute w-3 h-3 rounded-full bg-white shadow-md"
                style={{ left: '-4px' }}
                animate={{
                  y: ['0%', '100%'],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 2
                }}
              />
            </div>

            <div className="grid md:grid-cols-5 gap-8 md:gap-4 relative z-10 pl-12 md:pl-0">
              {[
                {
                  step: 1,
                  title: "Sign Up",
                  description: "Create your free account in seconds",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                  color: "#8B5CF6"
                },
                {
                  step: 2,
                  title: "Choose a Subject",
                  description: "Select what you want to learn or upload your own materials",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  color: "#3B82F6"
                },
                {
                  step: 3,
                  title: "Plan Your Course",
                  description: "Set time commitment, year level, age, and let AI plan your personalised course",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  ),
                  color: "#8B5CF6"
                },
                {
                  step: 4,
                  title: "Play & Learn",
                  description: "Engage with our AI-powered learning games",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: "#10B981"
                },
                {
                  step: 5,
                  title: "Master & Track",
                  description: "Watch your knowledge and retention grow",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  color: "#EF4444"
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col md:items-center items-start"
                >
                  {/* Step number with icon */}
                  <motion.div
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg mb-6 relative"
                    whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                    style={{ backgroundColor: `${step.color}15` }}
                  >
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {step.step}
                    </div>
                    <div style={{ color: step.color }}>{step.icon}</div>
                  </motion.div>

                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <Markdown
                    content={step.description}
                    className="text-gray-600 text-left md:text-center"
                  />
                </motion.div>
              ))}
            </div>

            {/* Call to action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-12 text-center"
            >
              <Link href={user ? "/dashboard" : "/login"}>
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Your Journey Now
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Learn With AI, Not From AI</h2>
            <Markdown
              content="Our scientifically-designed game modes ensure deep understanding, not surface-level memorisation"
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, i) => (
              <GameCard key={i} game={game} index={i} />
            ))}
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Built on Science,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  Powered by AI
                </span>
              </h2>

              <div className="space-y-6">
                {[
                  {
                    title: 'Spaced Repetition',
                    description: 'Optimally timed review sessions based on forgetting curves'
                  },
                  {
                    title: 'Active Recall',
                    description: 'Generate answers, don\'t just recognise them'
                  },
                  {
                    title: 'Metacognitive Reflection',
                    description: 'Build awareness of your own learning process'
                  },
                  {
                    title: 'Personalised Difficulty',
                    description: 'Always in your optimal challenge zone'
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <CheckIcon className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <Markdown
                        content={feature.description}
                        className="text-gray-600"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <img
                  src="/api/placeholder/600/400"
                  className="rounded-2xl shadow-2xl"
                />

                {/* Floating stats cards */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUpIcon className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Retention Rate</p>
                      <p className="text-xl font-bold">94%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <LightningIcon className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Study Streak</p>
                      <p className="text-xl font-bold">21 days</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by Learners</h2>
            <Markdown
              content="Join people who've transformed their study habits"
              className="text-xl text-gray-600"
            />
          </motion.div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonials[activeTestimonial].avatar}
                    </div>
                  </div>
                  <div>
                    <Markdown
                      content={`"${testimonials[activeTestimonial].quote}"`}
                      className="text-lg text-gray-700 mb-4 italic"
                    />
                    <div>
                      <p className="font-semibold">{testimonials[activeTestimonial].author}</p>
                      <p className="text-sm text-gray-500">{testimonials[activeTestimonial].role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeTestimonial 
                      ? 'w-8 bg-indigo-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Take Control of Your Learning?
              </h2>
              <Markdown
                content="Join 5+ students mastering subjects with AI that teaches, not cheats"
                className="text-xl mb-8 opacity-90"
              />

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={user ? "/dashboard" : "/login"}>
                  <motion.button
                    className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Free Trial
                  </motion.button>
                </Link>

                <motion.button
                  className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white/50"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Schedule Demo
                </motion.button>
              </div>

              <p className="mt-6 text-sm opacity-75">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  UpSkill
                </span>
              </h3>
              <Markdown
                content="Empowering learners to master any subject through AI-powered, gamified education."
                className="text-gray-600 text-sm"
              />
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/features" className="hover:text-indigo-600 transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-indigo-600 transition">Pricing</Link></li>
                <li><Link href="/for-schools" className="hover:text-indigo-600 transition">For Schools</Link></li>
                <li><Link href="/for-parents" className="hover:text-indigo-600 transition">For Parents</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-indigo-600 transition">About</Link></li>
                <li><Link href="/blog" className="hover:text-indigo-600 transition">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-indigo-600 transition">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-600 transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" className="hover:text-indigo-600 transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-600 transition">Terms</Link></li>
                <li><Link href="/coppa" className="hover:text-indigo-600 transition">COPPA</Link></li>
                <li><Link href="/ferpa" className="hover:text-indigo-600 transition">FERPA</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            <p>© 2025 ColonThree Inc. All rights reserved. Made with ❤️ for learners everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Icon Components
function CardIcon() {
  return (
    <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function CatIcon() {
  return (
    <svg className="w-16 h-16 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1-1 1-1 1 1-1 1zm4 0l-1-1 1-1 1 1-1 1zm-2-3c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  )
}

function CheckIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function ChartUpIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function ChartDownIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function TrendingUpIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function LightningIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

// Preview Components for Game Cards
function FlashcardPreview() {
  return (
    <div className="relative w-48 h-32 mx-auto">
      <motion.div
        className="absolute inset-0 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center"
        animate={{ rotateY: [0, 180, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <p className="text-purple-600 font-medium">Mitochondria?</p>
      </motion.div>
    </div>
  )
}

function JudgementCatPreview() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-4xl mb-2"
      >
        😼
      </motion.div>
      <p className="text-orange-600 italic">"That's... acceptable."</p>
    </div>
  )
}

function QuizPreview() {
  return (
    <div className="space-y-2">
      {[true, false, false].map((correct, i) => (
        <motion.div
          key={i}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.2 }}
          className={`h-8 rounded ${correct ? 'bg-green-500' : 'bg-gray-300'}`}
        />
      ))}
    </div>
  )
}

function ChatPreview() {
  return (
    <div className="space-y-2">
      <div className="bg-blue-100 rounded-lg p-2 text-xs">Why is the sky blue?</div>
      <div className="bg-gray-100 rounded-lg p-2 text-xs">Light scatters when...</div>
    </div>
  )
}

function CapstonePreview() {
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center"
    >
      <TrophyIcon />
    </motion.div>
  )
}
