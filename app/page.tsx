'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  const { user } = useAuth()

  // Library of funny and useful topics
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

  useEffect(() => {
    let timeout;

    const tick = () => {
      const i = loopNum % funnyTopics.length;
      const fullText = funnyTopics[i];

      const newText = isDeleting 
        ? fullText.substring(0, typingText.length - 1) 
        : fullText.substring(0, typingText.length + 1);

      setTypingText(newText);

      // Set typing speed
      if (isDeleting) {
        setTypingSpeed(75); // faster when deleting
      } else {
        setTypingSpeed(150); // slower when typing
      }

      // If completed typing the word
      if (!isDeleting && newText === fullText) {
        setTimeout(() => setIsDeleting(true), 1000); // wait before starting to delete
      } 
      // If deleted the word
      else if (isDeleting && newText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500); // pause before typing next word
      }
    };

    timeout = setTimeout(tick, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, loopNum, typingSpeed, funnyTopics]);

  useEffect(() => {
    // Update the DOM element with the current typing text
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
      typingElement.textContent = typingText + '_';
    }
  }, [typingText]);

  const handleCatInteraction = () => {
    const moods = ['>:3', ':3', 'ฅ^•ﻌ•^ฅ', '=^.^=', 'ᓚᘏᗢ', 'Ò.ó', '-.-']
    setCatMood(moods[Math.floor(Math.random() * moods.length)])
  }

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-12 px-4 text-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            src={catVideo} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <motion.div 
          className="mb-8 text-8xl cursor-pointer z-10 relative text-white drop-shadow-lg"
          onClick={handleCatInteraction}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {catMood}
        </motion.div>

        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-4 text-white z-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome to <span className="text-indigo-400">UpSkill</span>, Learn (Almost) Everything
        </motion.h1>

        <motion.p 
          className="text-xl md:text-2xl text-gray-200 max-w-3xl mb-8 z-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Learn anything effortlessly with our gamified micro-learning experience and a sarcastic cat mascot that makes studying addictive.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 z-10 relative sm:items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative flex flex-col w-64">
            <p className="text-sm text-gray-200 mb-2 text-left">I want to learn...</p>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 h-12 flex items-center">
              <div className="text-white min-w-[120px] text-left" id="typing-text">Elvish</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors touch-target h-12 flex items-center justify-center"
            >
              Get Started
            </Link>

          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why UpSkill Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-[95%] mx-auto justify-center">
            <motion.div 
              className="bg-white p-4 rounded-xl shadow-md"
              whileHover={{ y: -5 }}
            >
              <div className="text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gamified Learning</h3>
              <p className="text-gray-600">Turn boring study sessions into engaging games that make learning addictive.</p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              whileHover={{ y: -5 }}
            >
              <div className="text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">Our AI analyses your content and creates personalised study plans.</p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              whileHover={{ y: -5 }}
            >
              <div className="text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 10a1 1 0 011 1c0 2.236-.46 4.368-1.29 6.304a1 1 0 01-1.838-.789A13.952 13.952 0 009 11a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sarcastic Cat</h3>
              <p className="text-gray-600">Meet your new study buddy who's brutally honest but surprisingly motivating.</p>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              whileHover={{ y: -5 }}
            >
              <div className="text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Goal-Time Engine</h3>
              <p className="text-gray-600">Choose your outcome and schedule; our system breaks tasks into calendarised micro-blocks.</p>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-xl shadow-md"
              whileHover={{ y: -5 }}
            >
              <div className="text-3xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Data-Driven Pedagogy</h3>
              <p className="text-gray-600">Retrieval-spaced repetition, pre-test, mastery modelling—all evidence-backed learning methods.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Preview Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Experience Our Learning Games</h2>
          <p className="text-center text-lg text-gray-600 mb-12">
            Try all five game modes in our interactive demo - no signup required!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 w-[95%] mx-auto justify-center">
            {/* LLM Powered Flashcards */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="aspect-video bg-indigo-50 flex items-center justify-center p-4">
                <div className={`relative w-full max-w-xs ${styles.perspective500}`}>
                  <div className={`relative w-full h-32 transition-transform duration-700 ${styles.transformStyle3d} ${isFlipped ? styles.flashcardFlipped : ''}`}>
                    <div className={`absolute w-full h-full bg-white rounded-lg shadow p-4 flex items-center justify-center text-center ${styles.backfaceHidden}`}>
                      <p className="font-medium text-indigo-700">What are multidimensional vector spaces?</p>
                    </div>
                    <div className={`absolute w-full h-full bg-indigo-100 rounded-lg shadow p-4 flex items-center justify-center text-center ${styles.backfaceHidden} ${styles.rotateY180}`}>
                      <p className="text-sm">Mathematical structures that extend the concept of 2D/3D vectors to n dimensions, forming the foundation for many machine learning algorithms.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <button 
                      onClick={handleFlipCard}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded transition-colors cursor-pointer"
                    >
                      Flap
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">LLM Powered Flashcards</h3>
                <p className="text-gray-600">Study with AI-generated flashcards that adapt to your learning needs. Our LLM creates personalized cards based on your content.</p>
                <div className="mt-4 flex items-center text-sm text-indigo-600">
                  <span className="font-medium">Perfect for:</span>
                  <span className="ml-2">Spaced repetition, knowledge retention</span>
                </div>
              </div>
            </motion.div>

            {/* Judgement Cat */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="aspect-video bg-indigo-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center">
                  <div className="text-6xl mb-2">:3</div>
                  <div className="bg-gray-100 rounded-lg p-2 text-center italic">
                    "Hmm, not terrible. For a human."
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Judgement Cat</h3>
                <p className="text-gray-600">Test your knowledge with short answers judged by our sarcastic cat. Get personalised feedback with a side of attitude.</p>
                <div className="mt-4 flex items-center text-sm text-indigo-600">
                  <span className="font-medium">Perfect for:</span>
                  <span className="ml-2">Deep understanding, critical thinking</span>
                </div>
              </div>
            </motion.div>

            {/* Adaptive Quiz */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="aspect-video bg-indigo-50 flex items-center justify-center p-4">
                <div className="w-full max-w-xs">
                  <div className="bg-white rounded-lg shadow p-3 mb-3">
                    <p className="font-medium mb-2">Which process occurs in mitochondria?</p>
                    <div className="h-4 bg-indigo-100 rounded-full w-3/4 mb-1"></div>
                    <div className="h-4 bg-indigo-100 rounded-full w-full mb-1"></div>
                    <div className="h-4 bg-indigo-100 rounded-full w-2/3"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Difficulty: <span className="text-green-600">●</span></div>
                    <div className="text-sm">Mastery: 45%</div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Adaptive Quiz</h3>
                <p className="text-gray-600">Questions that adapt to your skill level for optimal learning. The difficulty adjusts in real-time based on your performance.</p>
                <div className="mt-4 flex items-center text-sm text-indigo-600">
                  <span className="font-medium">Perfect for:</span>
                  <span className="ml-2">Efficient learning, mastery tracking</span>
                </div>
              </div>
            </motion.div>

            {/* :3 Chat */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="aspect-video bg-indigo-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center w-full max-w-xs">
                  <div className="bg-white rounded-lg shadow p-3 mb-2 w-full">
                    <p className="font-medium mb-1">How does photosynthesis work?</p>
                  </div>
                  <div className="bg-indigo-100 rounded-lg p-3 self-start max-w-[80%] mb-2">
                    <p className="text-sm">Plants convert sunlight into energy through a process in chloroplasts.</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-3 self-end max-w-[80%]">
                    <p className="text-sm">Tell me more about the light-dependent reactions.</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">:3 Chat</h3>
                <p className="text-gray-600">Open chat where the cat tutors, explains, demonstrates and asks follow-up questions through Socratic dialogue.</p>
                <div className="mt-4 flex items-center text-sm text-indigo-600">
                  <span className="font-medium">Perfect for:</span>
                  <span className="ml-2">Deep understanding, conceptual exploration</span>
                </div>
              </div>
            </motion.div>

            {/* Capstone Interview */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="aspect-video bg-indigo-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center w-full max-w-xs">
                  <div className="bg-white rounded-lg shadow p-3 w-full mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    <div className="h-3 bg-indigo-400 rounded-full w-full animate-pulse"></div>
                  </div>
                  <div className="text-center text-sm text-indigo-600">
                    <p>Synthesise your knowledge in a voice or text interview</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Capstone Interview</h3>
                <p className="text-gray-600">Voice conversation or text interview summarising the topic to demonstrate synthesis and mastery of the material.</p>
                <div className="mt-4 flex items-center text-sm text-indigo-600">
                  <span className="font-medium">Perfect for:</span>
                  <span className="ml-2">Synthesis, transfer of knowledge</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Link 
                    href="/dashboard"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors flex-1 text-center text-sm"
                  >
                    Try Capstone Interview
                  </Link>
                </div>
              </div>
            </motion.div>



            {/* Get Started Card */}
            <motion.div 
              className="bg-white rounded-xl shadow-md overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="aspect-video bg-indigo-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center w-full max-w-xs">
                  <div className="bg-white rounded-full shadow-lg p-6 mb-3 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-center text-sm text-purple-600 font-semibold">
                    <p>Ready to explore all our learning modes?</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Start Your Learning Journey</h3>
                <p className="text-gray-600">Experience all our interactive learning modes and begin mastering any topic with our AI-powered platform.</p>
                <div className="mt-4">
                  <Link 
                    href="/dashboard" 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors inline-flex items-center gap-2 w-full justify-center"
                  >
                    Get Started
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Interactive Demo button removed */}
        </div>
      </section>


    </main>
  )
}
