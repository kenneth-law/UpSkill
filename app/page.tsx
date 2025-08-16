'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
import styles from './styles.module.css'
import catVideo from '@/components/media/cat_720p.mp4'
import { useAuth } from '@/lib/auth/auth-provider'

export default function Home() {
  const [catMood, setCatMood] = useState(':3')
  const [typingText, setTypingText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(150)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState(null)
  const { user } = useAuth()

  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const gamesRef = useRef(null)

  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  // Parallax transforms
  const heroY = useTransform(smoothProgress, [0, 1], ['0%', '50%'])
  const floatY = useTransform(smoothProgress, [0, 1], ['0%', '-100%'])
  const rotateZ = useTransform(smoothProgress, [0, 1], [0, 360])

  // Library of topics
  const funnyTopics = [
    "Elvish",
    "Fourier transformation",
    "Alien cooking",
    "PL/SQL",
    "Dragon taming",
    "Personal finance basics",
    "How to call back your ex without sounding desperate",
    "Unicorn grooming",
    "Mandarin",
    "Time management techniques",
    "Emotional intelligence",
    "Public speaking",
    "Negotiation skills",
    "Critical thinking",
    "Data privacy fundamentals",
    "Nutrition science",
    "Mindfulness meditation",
    "Design thinking",
    "Quantum computing basics",
    "Blockchain technology",
    "Machine learning fundamentals",
    "Digital security practices",
    "Effective communication",
    "Conflict resolution",
    "Systems thinking",
    "Statistical analysis",
    "Information architecture",
    "Cognitive biases",
    "Sustainable living practices",
    "Renewable energy concepts",
    "First aid essentials",
    "Productivity methods",
    "Creative problem solving",
    "Networking fundamentals",
    "Cloud computing basics",
    "Cybersecurity principles",
    "Project management",
    "User experience design",
    "Content strategy",
    "Digital marketing basics",
    "Ethical hacking",
    "Artificial intelligence ethics",
    "Microeconomics principles",
    "Psychology of habit formation",
    "Logical fallacies",
    "Effective learning techniques",
    "Personal branding",
    "Remote work best practices",
    "Intellectual property basics",
    "Stress management",
    "Financial investment basics",
    "Healthy sleep habits",
    "Technical writing",
    "Cross-cultural communication"
  ]

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Typing animation
  useEffect(() => {
    let timeout;
    const tick = () => {
      const i = loopNum % funnyTopics.length;
      const fullText = funnyTopics[i];
      const newText = isDeleting
        ? fullText.substring(0, typingText.length - 1)
        : fullText.substring(0, typingText.length + 1);
      setTypingText(newText);
      setTypingSpeed(isDeleting ? 75 : 150);
      if (!isDeleting && newText === fullText) {
        setTimeout(() => setIsDeleting(true), 1000);
      } else if (isDeleting && newText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500);
      }
    };
    timeout = setTimeout(tick, typingSpeed);
    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, loopNum, typingSpeed, funnyTopics]);

  const handleCatInteraction = () => {
    const moods = ['>:3', ':3', 'ฅ^•ﻌ•^ฅ', '=^.^=', 'ᓚᘏᗢ', 'Ò.ó', '-.-', '(=｀ω´=)', '(^･o･^)ﾉ"', '( ˙꒳˙ )']
    setCatMood(moods[Math.floor(Math.random() * moods.length)])
  }

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped)
  }

  // Feature cards with icons
  const features = [
    { icon: '🧩', title: 'Gamified Learning', desc: 'Turn boring study sessions into engaging games that make learning addictive.', color: 'from-purple-400 to-pink-400' },
    { icon: '🤖', title: 'AI-Powered', desc: 'Our AI analyses your content and creates personalised study plans.', color: 'from-blue-400 to-cyan-400' },
    { icon: '😼', title: 'Sarcastic Cat', desc: "Meet your new study buddy who's brutally honest but surprisingly motivating.", color: 'from-orange-400 to-yellow-400' },
    { icon: '📅', title: 'Goal-Time Engine', desc: 'Choose your outcome and schedule; our system breaks tasks into calendarised micro-blocks.', color: 'from-green-400 to-teal-400' },
    { icon: '📊', title: 'Data-Driven Pedagogy', desc: 'Retrieval-spaced repetition, pre-test, mastery modelling—all evidence-backed learning methods.', color: 'from-indigo-400 to-purple-400' }
  ]

  const gameCards = [
    {
      title: 'LLM Powered Flashcards',
      desc: 'Study with AI-generated flashcards that adapt to your learning needs.',
      perfect: 'Spaced repetition, knowledge retention',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      title: 'Judgement Cat',
      desc: 'Test your knowledge with short answers judged by our sarcastic cat.',
      perfect: 'Deep understanding, critical thinking',
      gradient: 'from-orange-500 to-pink-600'
    },
    {
      title: 'Adaptive Quiz',
      desc: 'Questions that adapt to your skill level for optimal learning.',
      perfect: 'Efficient learning, mastery tracking',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      title: ':3 Chat',
      desc: 'Open chat where the cat tutors through Socratic dialogue.',
      perfect: 'Deep understanding, conceptual exploration',
      gradient: 'from-green-500 to-teal-600'
    },
    {
      title: 'Capstone Interview',
      desc: 'Voice or text interview to demonstrate synthesis and mastery.',
      perfect: 'Synthesis, transfer of knowledge',
      gradient: 'from-red-500 to-orange-600'
    }
  ]

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Floating geometric shapes */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32"
          style={{ y: floatY }}
        >
          <div className="w-full h-full bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-3xl transform rotate-45 blur-xl" />
        </motion.div>
        <motion.div
          className="absolute top-96 right-20 w-40 h-40"
          style={{ rotate: rotateZ }}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl" />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-1/4 w-24 h-24"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-green-200/30 to-teal-200/30 rounded-2xl transform rotate-12" />
        </motion.div>
      </div>

      {/* Hero Section with enhanced design */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center py-20 px-4 overflow-hidden">
        {/* Video Background with better overlay */}
        <motion.div
          className="absolute inset-0 w-full h-full z-0"
          style={{ y: heroY }}
        >
          <video
            src={catVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20" />
        </motion.div>

        {/* Animated particles */}
        <div className="absolute inset-0 z-1">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 20
              }}
              animate={{
                y: -20,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <motion.div
          className="mb-12 relative z-10"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <motion.div
            className="text-8xl cursor-pointer text-white drop-shadow-2xl select-none"
            onClick={handleCatInteraction}
            whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.9 }}
            animate={{
              textShadow: [
                "0 0 20px rgba(147, 51, 234, 0.5)",
                "0 0 40px rgba(236, 72, 153, 0.5)",
                "0 0 20px rgba(147, 51, 234, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {catMood}
          </motion.div>
          <motion.div
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            .
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 text-white z-10 relative text-center max-w-5xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          Welcome to{' '}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              UpSkill
            </span>
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 blur-xl opacity-50"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </span>
          <br />
          <span className="text-3xl md:text-5xl opacity-90">Learn (Almost) Everything</span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-gray-100 max-w-3xl mb-12 z-10 relative text-center leading-relaxed"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          Learn anything effortlessly with our gamified micro-learning experience
          and a sarcastic cat mascot that makes studying addictive.
        </motion.p>

        {/* Enhanced CTA section */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 z-10 relative items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl blur-xl opacity-50"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <p className="text-sm text-gray-200 mb-3 font-medium">I want to learn...</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 min-w-[280px]">
                <div className="text-white text-lg font-medium">
                  {typingText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-5 bg-white ml-1 align-middle"
                  />
                </div>
              </div>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={user ? "/dashboard" : "/login"}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-70 group-hover:opacity-100" />
              <div className="relative bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold py-4 px-10 rounded-xl shadow-2xl transition-all text-lg">
                Get Started
                <motion.span
                  className="inline-block ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section with 3D cards */}
      <section ref={featuresRef} className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Why UpSkill Works
            </h2>
            <p className="text-lg text-gray-600">Revolutionary learning backed by cognitive science</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <motion.div
                  className="relative h-full"
                  animate={{
                    rotateX: hoveredCard === index ? -10 : 0,
                    rotateY: hoveredCard === index ? 10 : 0,
                    z: hoveredCard === index ? 50 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300`} />
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                    <motion.div
                      className="text-5xl mb-4"
                      animate={{
                        rotate: hoveredCard === index ? [0, -10, 10, 0] : 0,
                        scale: hoveredCard === index ? 1.2 : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Preview Section with enhanced cards */}
      <section ref={gamesRef} className="py-24 px-4 bg-gradient-to-b from-transparent to-indigo-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Experience Our Learning Games
            </h2>
            <p className="text-lg text-gray-600">
              Try all five game modes in our interactive demo - no signup required!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Enhanced Flashcard Demo */}
            <motion.div
              className="group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
                <div className="p-8">
                  <div className="aspect-video bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center p-6 mb-6">
                    <div className="relative w-full max-w-sm">
                      <motion.div
                        className={`relative h-40 ${styles.transformStyle3d}`}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div className={`absolute w-full h-full bg-gradient-to-br from-white to-violet-50 rounded-2xl shadow-lg p-6 flex items-center justify-center ${styles.backfaceHidden}`}>
                          <p className="font-bold text-violet-700 text-center">What are multidimensional vector spaces?</p>
                        </div>
                        <div className={`absolute w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg p-6 flex items-center justify-center ${styles.backfaceHidden} ${styles.rotateY180}`}>
                          <p className="text-white text-sm text-center">Mathematical structures extending 2D/3D vectors to n dimensions.</p>
                        </div>
                      </motion.div>
                      <motion.button
                        onClick={handleFlipCard}
                        className="mt-4 mx-auto block bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Flip Card
                      </motion.button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {gameCards[0].title}
                  </h3>
                  <p className="text-gray-600 mb-4">{gameCards[0].desc}</p>
                  <div className="flex items-center text-sm">
                    <span className="font-semibold text-violet-600">Perfect for:</span>
                    <span className="ml-2 text-gray-500">{gameCards[0].perfect}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Judgement Cat Enhanced */}
            <motion.div
              className="group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-pink-600" />
                <div className="p-8">
                  <div className="aspect-video bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl flex items-center justify-center p-6 mb-6">
                    <motion.div
                      className="flex flex-col items-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        className="text-7xl mb-4"
                        animate={{ rotate: [-5, 5, -5] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        😼
                      </motion.div>
                      <div className="bg-white rounded-2xl p-4 shadow-md">
                        <p className="italic text-gray-700">"Hmm, not terrible. For a human."</p>
                      </div>
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    {gameCards[1].title}
                  </h3>
                  <p className="text-gray-600 mb-4">{gameCards[1].desc}</p>
                  <div className="flex items-center text-sm">
                    <span className="font-semibold text-orange-600">Perfect for:</span>
                    <span className="ml-2 text-gray-500">{gameCards[1].perfect}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Other game cards with similar enhancements */}
            {gameCards.slice(2).map((game, index) => (
              <motion.div
                key={index + 2}
                className="group"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (index + 2) * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden h-full">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${game.gradient}`} />
                  <div className="p-8">
                    <div className={`aspect-video bg-gradient-to-br ${
                      index === 0 ? 'from-blue-50 to-cyan-50' : 
                      index === 1 ? 'from-green-50 to-teal-50' : 
                      'from-red-50 to-orange-50'
                    } rounded-2xl flex items-center justify-center p-6 mb-6`}>
                      <motion.div
                        className="text-6xl"
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {index === 0 ? '📝' : index === 1 ? '💬' : '🎙️'}
                      </motion.div>
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent`}>
                      {game.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{game.desc}</p>
                    <div className="flex items-center text-sm">
                      <span className={`font-semibold ${
                        index === 0 ? 'text-blue-600' : 
                        index === 1 ? 'text-green-600' : 
                        'text-red-600'
                      }`}>Perfect for:</span>
                      <span className="ml-2 text-gray-500">{game.perfect}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Start Journey Card */}
            <motion.div
              className="group md:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -10 }}
            >
              <div className="relative bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl shadow-xl overflow-hidden h-full">
                <div className="absolute inset-0 bg-black/10" />
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    ]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                <div className="relative p-8 flex flex-col justify-center items-center text-center h-full">
                  <motion.div
                    className="text-7xl mb-6"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                  >
                    ✨
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-4 text-white">
                    Start Your Learning Journey
                  </h3>
                  <p className="text-white/90 mb-8">
                    Experience all our interactive learning modes and begin mastering any topic with our AI-powered platform.
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/dashboard"
                      className="bg-white text-purple-600 font-bold py-4 px-8 rounded-full shadow-lg inline-flex items-center gap-3 hover:shadow-xl transition-all"
                    >
                      Get Started
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer gradient */}
      <div className="h-32 bg-gradient-to-b from-transparent to-indigo-100/50" />
    </main>
  )
}