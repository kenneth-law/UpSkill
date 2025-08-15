'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import catVideo from '@/components/media/cat_720p.mp4'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/lib/auth/auth-provider'

// Client component that uses useSearchParams
function StudyPlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasCalledApi = useRef(false) // Prevent duplicate API calls
  const { user } = useAuth() // Get the authenticated user

  // Extract parameters from URL
  const topic = searchParams.get('topic') || ''
  const frequency = searchParams.get('frequency') || '4'
  const duration = searchParams.get('duration') || '15'
  const masteryDepth = parseInt(searchParams.get('masteryDepth') || '50')
  const studySpan = parseInt(searchParams.get('studySpan') || '30')
  const extractedText = searchParams.get('extractedText') || ''
  const textSource = searchParams.get('textSource') || ''

  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Analyzing your topic...')
  const [catMood, setCatMood] = useState(':3')
  const [catPhrase, setCatPhrase] = useState('Learning in progress!')
  const [error, setError] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [openaiRequestData, setOpenaiRequestData] = useState<string | null>(null)
  const [showRequestData, setShowRequestData] = useState(false)

  // Process steps with estimated percentage of total time
  const processSteps = [
    { text: 'Analysing your topic...', percentage: 10 },
    { text: 'Extracting key concepts...', percentage: 30 },
    { text: 'Creating personalized study sessions...', percentage: 40 },
    { text: 'Storing your study plan...', percentage: 15 },
    { text: 'Finalising your study plan...', percentage: 5 }
  ]

  // Block generation for the animation
  const generateBlocks = () => {
    const concepts = [
      { text: 'Core concepts', emoji: '🧠', description: 'The building blocks of knowledge!' },
      { text: 'Key principles', emoji: '🔑', description: 'Unlock your potential!' },
      { text: 'Fundamental theories', emoji: '💡', description: 'Mind-blowing ideas ahead!' },
      { text: 'Essential formulas', emoji: '⚗️', description: 'Math magic at your fingertips!' },
      { text: 'Important definitions', emoji: '📚', description: 'Words to live by!' },
      { text: 'Critical relationships', emoji: '🔄', description: 'Everything is connected!' },
      { text: 'Primary methods', emoji: '🛠️', description: 'Tools for your brain!' },
      { text: 'Key techniques', emoji: '🎯', description: 'Hit the bullseye every time!' },
      { text: 'Foundational elements', emoji: '🏗️', description: 'Building your knowledge tower!' },
      { text: 'Central ideas', emoji: '🌟', description: 'Stars of the show!' },
      { text: 'Major frameworks', emoji: '🖼️', description: 'See the big picture!' },
      { text: 'Key models', emoji: '🧩', description: 'Putting it all together!' }
    ]

    // We'll keep them in order for a more dramatic sequential appearance
    return [...concepts]
  }

  // Function to update cat mood randomly with fun phrases
  const updateCatMood = () => {
    const moods = [
      { face: '>:3', phrase: 'Focusing intensely!' },
      { face: ':3', phrase: 'Learning is fun!' },
      { face: 'ฅ^•ﻌ•^ฅ', phrase: 'Knowledge incoming!' },
      { face: '=^.^=', phrase: 'Purr-fect progress!' },
      { face: 'ᓚᘏᗢ', phrase: 'Mind expanding!' },
      { face: '(^ↀᴥↀ^)', phrase: 'Getting smarter!' },
      { face: '(ﾐ⚈ ﻌ ⚈ﾐ)', phrase: 'Brain power up!' },
      { face: '(=^･ω･^=)', phrase: 'Meow-velous learning!' }
    ]
    const mood = moods[Math.floor(Math.random() * moods.length)]
    setCatMood(mood.face)
    setCatPhrase(mood.phrase)
  }

  // Function to make the actual API call
  const generateStudyPlan = async () => {
    // Prevent duplicate calls
    if (hasCalledApi.current) {
      console.log('[DEBUG-CLIENT] API already called, skipping duplicate')
      return
    }
    hasCalledApi.current = true

    try {
      // Check if user ID is available
      if (!user?.id) {
        console.error('[DEBUG-CLIENT] User ID not available. User object:', user);
        throw new Error('User ID not available. Please ensure you are logged in and try again.');
      }

      console.log('[DEBUG-CLIENT] Starting study plan generation request', {
        topic,
        frequency,
        duration,
        masteryDepth,
        studySpan,
        hasExtractedText: !!extractedText,
        userId: user.id
      })

      // Track progress through the different steps
      let currentStepIndex = 0;
      let currentProgressPercentage = 0;

      // Function to update progress based on current step
      const updateProgress = (stepIndex: number, percentComplete: number) => {
        const previousStepsPercentage = stepIndex > 0
          ? processSteps.slice(0, stepIndex).reduce((sum, step) => sum + step.percentage, 0)
          : 0;

        const currentStepContribution = processSteps[stepIndex].percentage * (percentComplete / 100);
        const newProgress = Math.min(Math.round(previousStepsPercentage + currentStepContribution), 100);

        setCurrentStep(processSteps[stepIndex].text);
        setProgress(newProgress);
        currentProgressPercentage = newProgress;
      };

      // Start with the first step
      updateProgress(0, 0);

      // Progress simulation that advances through steps while API call is in progress
      const progressInterval = setInterval(() => {
        // Advance to next step if current step is complete
        if (currentProgressPercentage >= processSteps[currentStepIndex].percentage +
            (currentStepIndex > 0 ? processSteps.slice(0, currentStepIndex).reduce((sum, step) => sum + step.percentage, 0) : 0)) {
          if (currentStepIndex < processSteps.length - 1) {
            currentStepIndex++;
            updateProgress(currentStepIndex, 0);
          }
        } else {
          // Increment progress within current step
          const stepProgress = Math.min(
            ((currentProgressPercentage - (currentStepIndex > 0 ?
              processSteps.slice(0, currentStepIndex).reduce((sum, step) => sum + step.percentage, 0) : 0)) /
              processSteps[currentStepIndex].percentage) * 100 + 5,
            100
          );
          updateProgress(currentStepIndex, stepProgress);
        }
      }, 500);

      // Prepare the request data
      const requestData = {
        topic,
        frequency,
        duration,
        masteryDepth,
        studySpan,
        extractedText,
        userId: user?.id // Include the user ID in the request
      };

      // Store the request data for display in the hover window
      setOpenaiRequestData(JSON.stringify(requestData, null, 2));

      // Make the actual API call
      console.log('[DEBUG-CLIENT] Sending request to generate study plan with credentials included');
      console.log('[DEBUG-CLIENT] User ID being sent:', user?.id);

      const response = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Explicitly include credentials (cookies)
        body: JSON.stringify(requestData),
      });

      // Clear the interval once we get a response
      clearInterval(progressInterval);

      console.log('[DEBUG-CLIENT] API response status:', response.status, response.statusText);

      // Handle 401 Unauthorized errors specifically
      if (response.status === 401) {
        console.error('[DEBUG-CLIENT] Authentication error (401). User session may be invalid or expired.');
        const errorData = await response.json().catch(() => ({ error: 'Authentication required' }));
        throw new Error(errorData.error || 'Authentication required. Please ensure you are logged in and try again.');
      }

      // Handle 429 Too Many Requests (duplicate request)
      if (response.status === 429) {
        console.log('[DEBUG-CLIENT] Duplicate request detected by server');
        return; // Just return, don't show error
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[DEBUG-CLIENT] Error response:', errorData);
        // Use the more detailed error message if available
        const errorMessage = errorData.message || errorData.error || `Failed to generate study plan: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Update to the final step
      setCurrentStep('Finalizing your study plan...');
      setProgress(100);

      const data = await response.json();
      console.log('[DEBUG-CLIENT] Study plan generated successfully', {
        success: data.success,
        topicId: data.topicId,
        studyPlanId: data.studyPlanId,
        hasPrompts: !!data.openaiPrompts
      });

      // Update the OpenAI request data with the actual prompts sent to OpenAI
      if (data.openaiPrompts) {
        const formattedPrompts = {
          frontend: requestData,
          openai: {
            conceptExtraction: data.openaiPrompts.conceptExtraction,
            studyPlanGeneration: data.openaiPrompts.studyPlanGeneration
          }
        };
        setOpenaiRequestData(JSON.stringify(formattedPrompts, null, 2));
      }

      // Set progress to 100% when complete
      setProgress(100);

      // Redirect to course page with the topic ID after a short delay
      console.log('[DEBUG-CLIENT] Redirecting to course page with topic ID:', data.topicId);
      setTimeout(() => {
        router.push(`/course/${data.topicId}`);
      }, 1000);

    } catch (error) {
      console.error('[DEBUG-CLIENT] Error generating study plan:', error);
      setError((error as Error).message || 'Failed to generate your study plan. Please try again.');
      setCatMood('Ò.ó');
      hasCalledApi.current = false; // Reset so user can retry
    }
  }

  useEffect(() => {
    // Add blocks one by one with delays
    if (blocks.length === 0) {
      const allBlocks = generateBlocks();

      // Function to add blocks one by one with delays
      const addBlocksSequentially = () => {
        let currentIndex = 0;

        const addNextBlock = () => {
          if (currentIndex < allBlocks.length) {
            // Add the next block at the beginning of the array so it appears on top
            setBlocks(prevBlocks => [allBlocks[currentIndex], ...prevBlocks]);
            currentIndex++;

            // Schedule the next block with a random delay between 5-8 seconds
            setTimeout(addNextBlock, 5000 + Math.random() * 3000);
          }
        };

        // Start adding blocks
        addNextBlock();
      };

      // Start the sequential addition process
      addBlocksSequentially();
    }

    // Update cat mood periodically
    const moodInterval = setInterval(updateCatMood, 3000)

    // Start the actual API call only once
    if (!hasCalledApi.current) {
      generateStudyPlan()
    }

    return () => {
      clearInterval(moodInterval)
    }
  }, []) // Empty dependency array - only run once on mount

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Video Background with Gradient Overlay */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            src={catVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-indigo-800/70 to-blue-900/70"></div>
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 px-4 py-16 text-white">
          {/* Cat animation with phrase */}
          <div className="mb-8 flex flex-col items-center">
            <motion.div
              className="text-8xl"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {catMood}
            </motion.div>
            <motion.p
              className="mt-2 text-xl font-bold text-pink-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={catPhrase} // This ensures animation triggers on phrase change
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 200
              }}
            >
              {catPhrase}
            </motion.p>
          </div>

          {/* Title and current step */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Creating Your Study Plan
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl mb-12 text-center max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {currentStep}
          </motion.p>

          {/* Progress bar */}
          <div className="w-full max-w-md mb-16 relative">
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div
                className="text-white/70 cursor-pointer flex items-center"
                onMouseEnter={() => setShowRequestData(true)}
                onMouseLeave={() => setShowRequestData(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>OpenAI Request</span>

                {/* Hover window */}
                {showRequestData && openaiRequestData && (
                  <div className="absolute left-0 bottom-full mb-2 p-4 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl text-left w-full max-w-md z-50">
                    <h3 className="text-white text-sm font-semibold mb-2">Data sent to OpenAI:</h3>
                    <pre className="text-xs text-white/80 overflow-auto max-h-60 p-2 bg-black/30 rounded">
                      {openaiRequestData}
                    </pre>
                  </div>
                )}
              </div>
              <div className="text-white/70">
                {progress}%
              </div>
            </div>
          </div>

          {/* Animated blocks - Stacked Layout */}
          <div className="w-full max-w-6xl relative">
            <div className="flex flex-col items-center justify-center pb-6 px-8">
              <div className="relative h-[300px] w-[300px]">
                <AnimatePresence>
                  {blocks.map((block, index) => {
                    // Calculate if this card should shake based on progress
                    const shouldShake = progress > 50 && progress < 100;
                    // Increase shake intensity as progress approaches 100%
                    const shakeIntensity = progress > 50 ? (progress - 50) / 50 : 0;

                    // Determine if explosion should happen
                    const shouldExplode = progress >= 100;

                    return (
                      <motion.div
                        key={`block-${index}`}
                        className="absolute top-0 left-0 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-xl w-72"
                        initial={{
                          opacity: 0,
                          scale: 0,
                          y: -100,
                          rotateZ: Math.random() * 10 - 5, // Random slight rotation
                        }}
                        animate={{
                          opacity: shouldExplode ? 0 : 1,
                          scale: shouldExplode ? 1.5 : 1,
                          y: shouldExplode 
                            ? (Math.random() * 500 - 250) // Random explosion direction
                            : index * -5, // Stacked with slight offset
                          x: shouldExplode 
                            ? (Math.random() * 500 - 250) // Random explosion direction
                            : 0,
                          rotateZ: shouldExplode 
                            ? (Math.random() * 180 - 90) // Random explosion rotation
                            : (Math.random() * 6 - 3), // Slight random rotation for stacked effect
                          ...(shouldShake && {
                            x: [
                              0,
                              shakeIntensity * 5 * (Math.random() > 0.5 ? 1 : -1),
                              0,
                              shakeIntensity * 5 * (Math.random() > 0.5 ? 1 : -1),
                              0
                            ],
                            y: [
                              index * -5,
                              index * -5 + shakeIntensity * 3 * (Math.random() > 0.5 ? 1 : -1),
                              index * -5,
                              index * -5 + shakeIntensity * 3 * (Math.random() > 0.5 ? 1 : -1),
                              index * -5
                            ]
                          })
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0,
                          transition: { duration: 0.3 }
                        }}
                        transition={{
                          duration: shouldExplode ? 0.8 : 0.6,
                          delay: 0, // No additional delay needed as we're adding blocks with delays
                          ease: shouldExplode ? "easeOut" : "easeOut",
                          type: shouldExplode ? "tween" : "spring",
                          stiffness: 100,
                          ...(shouldShake && {
                            x: {
                              repeat: Infinity,
                              duration: 0.5 - (shakeIntensity * 0.3), // Shake faster as progress increases
                              ease: "easeInOut"
                            },
                            y: {
                              repeat: Infinity,
                              duration: 0.5 - (shakeIntensity * 0.3), // Shake faster as progress increases
                              ease: "easeInOut"
                            }
                          })
                        }}
                        style={{
                          zIndex: blocks.length - index, // Stack order
                          transformOrigin: "center center",
                          boxShadow: `0 ${index * 2}px ${index * 3}px rgba(0,0,0,0.${index + 1})`,
                        }}
                      >
                        <div className="flex items-center">
                          <span className="text-3xl mr-3">{block.emoji}</span>
                          <div>
                            <p className="text-lg font-bold text-white">{block.text}</p>
                            <p className="text-sm text-white/80 mt-1">{block.description}</p>
                          </div>
                        </div>


                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Explosion effect */}
              {progress >= 100 && (
                <motion.div 
                  className="absolute inset-0"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 8, 0], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 blur-xl"></div>
                </motion.div>
              )}

            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              className="mt-8 p-4 bg-red-500/20 border border-red-500 rounded-lg max-w-md text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>{error}</p>
              <button
                onClick={() => {
                  hasCalledApi.current = false;
                  setError(null);
                  generateStudyPlan();
                }}
                className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg font-medium mr-2"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/plan-study')}
                className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg font-medium"
              >
                Go Back
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}

// Main component that wraps StudyPlanContent with Suspense
export default function CreatingStudyPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white p-4">
        <div className="text-6xl mb-4">:3</div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">Loading Study Plan</h1>
        <div className="w-full max-w-md mb-8">
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
        <p className="text-xl text-center">Preparing your personalized learning experience...</p>
      </div>
    }>
      <StudyPlanContent />
    </Suspense>
  );
}
