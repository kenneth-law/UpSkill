'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-provider'
import { getUserProfile, getUserTopics, upsertUserProfile } from '@/lib/utils/supabase-client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, XCircle } from 'lucide-react'
import axios from 'axios'

// Define types for our data
type UserProfile = {
  id: string
  username: string
  display_name: string
  avatar_url: string
  study_streak: number
  total_xp: number
  cat_friendship_level: number
  preferences: any
  created_at: string
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

// Function to get a random greeting
const getRandomGreeting = () => {
  const greetings = [
    "Hello",
    "Welcome Back",
    "Hey There",
    "Meow",
    "Happy Late Nights"
  ]
  const randomIndex = Math.floor(Math.random() * greetings.length)

  // Check if it's after 10pm for "Happy Late Nights"
  const currentHour = new Date().getHours()
  if (randomIndex === 4 && (currentHour < 22 && currentHour >= 5)) {
    // If it's not after 10pm, pick another greeting
    return greetings[Math.floor(Math.random() * 4)]
  }

  return greetings[randomIndex]
}

// Function to calculate days since signup
const calculateDaysSinceSignup = (createdAt: string) => {
  const signupDate = new Date(createdAt)
  const currentDate = new Date()
  const diffTime = Math.abs(currentDate.getTime() - signupDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function Dashboard() {
  const { user, session, isLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [greeting, setGreeting] = useState("")
  const [catRating, setCatRating] = useState("")
  const [isCatRatingLoading, setIsCatRatingLoading] = useState(false)

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [topicToGiveUp, setTopicToGiveUp] = useState<Topic | null>(null)

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    // Fetch user profile and topics
    const fetchData = async () => {
      if (user) {
        setIsLoadingData(true)
        let userProfile = await getUserProfile(user.id)

        // If user profile doesn't exist, create a default one
        if (!userProfile) {
          console.log('Creating default profile for new user:', user.id)

          // Create a default profile with basic information
          // Ensure username is unique by adding a timestamp and part of the user ID
          const timestamp = Date.now();
          const userIdSuffix = user.id.substring(0, 6); // Take first 6 chars of UUID
          const defaultProfile = {
            id: user.id,
            username: `${user.email?.split('@')[0] || 'user'}_${userIdSuffix}_${timestamp}`,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            avatar_url: user.user_metadata?.avatar_url || '',
            study_streak: 0,
            total_xp: 0,
            cat_friendship_level: 0,
            preferences: { cat_snark_level: 'medium', daily_goal_minutes: 15 },
            created_at: new Date().toISOString()
          }

          // Insert the new profile
          const result = await upsertUserProfile(defaultProfile)

          if (result) {
            userProfile = result[0]
            console.log('Default profile created successfully')
          } else {
            console.error('Failed to create default profile')
          }
        }

        const userTopics = await getUserTopics(user.id)

        setProfile(userProfile)
        setTopics(userTopics || [])

        // Set random greeting
        setGreeting(getRandomGreeting())

        setIsLoadingData(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, isLoading, router])

  // Generate cat rating when profile and topics are loaded
  useEffect(() => {
    // Function to check if we should generate a cat rating today
    const shouldGenerateCatRating = () => {
      if (!user) return false;

      // Check if localStorage is available (not in SSR)
      if (typeof window === 'undefined' || !window.localStorage) {
        return true; // Default to generating if localStorage is not available
      }

      // Get the last generation date from localStorage
      const lastGenerationKey = `lastCatRating_date_${user.id}`;
      const lastGeneration = localStorage.getItem(lastGenerationKey);

      if (!lastGeneration) {
        // First time user is logging in, generate a rating
        return true;
      }

      // Check if the last generation was on a different day
      const lastDate = new Date(lastGeneration);
      const today = new Date();

      // Compare year, month, and day to check if it's a new day
      return (
        lastDate.getFullYear() !== today.getFullYear() ||
        lastDate.getMonth() !== today.getMonth() ||
        lastDate.getDate() !== today.getDate()
      );
    };

    // Function to load the saved cat rating from localStorage
    const loadSavedCatRating = () => {
      if (!user || typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const savedRatingKey = `lastCatRating_message_${user.id}`;
      const savedRating = localStorage.getItem(savedRatingKey);

      if (savedRating) {
        setCatRating(savedRating);
        console.log('Loaded saved cat rating from localStorage');
      }
    };

    const generateCatRating = async () => {
      // First, try to load any saved rating
      loadSavedCatRating();

      // Only proceed with generating a new rating if we should
      if (!shouldGenerateCatRating()) {
        console.log('Skipping cat rating generation - already generated today');
        return;
      }

      if (profile && !isCatRatingLoading) {
        setIsCatRatingLoading(true);

        try {
          // Prepare data about the user's study habits
          const studyData = {
            username: profile.username || 'User',
            daysSinceSignup: profile.created_at ? calculateDaysSinceSignup(profile.created_at) : 1,
            totalTopics: topics.length,
            completedTopics: topics.filter(topic => !topic.is_active).length,
            totalXp: profile.total_xp || 0,
            studyStreak: profile.study_streak || 0
          }

          // Request a cat rating from the API
          const response = await axios.post('/api/chat', {
            message: `Generate a humorous cat-like roast (max 2 sentences) about this user's study habits: 
            They've been signed up for ${studyData.daysSinceSignup} days, 
            have ${studyData.totalTopics} courses with ${studyData.completedTopics} completed, 
            ${studyData.studyStreak} day study streak, and ${studyData.totalXp} XP. 
            If they haven't studied much, urge them to start. Be snarky but encouraging.`
          })

          if (response.data && response.data.response) {
            const newRating = response.data.response;
            setCatRating(newRating);

            // Save both the current date and the rating message
            if (user && typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(`lastCatRating_date_${user.id}`, new Date().toISOString());
              localStorage.setItem(`lastCatRating_message_${user.id}`, newRating);
            }
          } else {
            setCatRating("Meow... I'm judging your study habits silently.")
          }
        } catch (error) {
          console.error('Error generating cat rating:', error)
          setCatRating("Error loading cat rating. The cat is probably napping.")
        } finally {
          setIsCatRatingLoading(false)
        }
      } else if (!profile && !isCatRatingLoading) {
        // Set a default message if profile is null
        setCatRating("Meow... I'm waiting for your profile to load. Or maybe you don't have one yet?")
      }
    }

    // Generate the cat rating (will only proceed if conditions are met)
    generateCatRating();

  }, [profile, topics, isCatRatingLoading, user])

  // Calculate user level based on XP (simple formula)
  const calculateLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  // Determine membership level based on XP
  const getMembershipLevel = (xp: number) => {
    if (xp >= 10000) return 'Platinum'
    if (xp >= 5000) return 'Gold'
    if (xp >= 1000) return 'Silver'
    return 'Bronze'
  }

  // Function to handle giving up on a course
  const handleGiveUp = async () => {
    if (!topicToGiveUp) return

    console.log('[DEBUG-CLIENT] Starting delete operation for topic:', {
      id: topicToGiveUp.id,
      title: topicToGiveUp.title
    })

    console.log('[DEBUG-CLIENT] Auth state:', {
      isAuthenticated: !!user,
      userId: user?.id?.substring(0, 8) + '...',
      hasSession: !!session
    })

    try {
      console.log('[DEBUG-CLIENT] Sending DELETE request to API')
      // Delete the topic completely instead of just marking it as inactive
      const response = await fetch(`/api/topics/${topicToGiveUp.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })

      console.log('[DEBUG-CLIENT] Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type')
        }
      })

      // Try to parse the response body
      let responseData;
      try {
        responseData = await response.json();
        console.log('[DEBUG-CLIENT] Response data:', responseData);
      } catch (parseError) {
        console.log('[DEBUG-CLIENT] Could not parse response as JSON');
      }

      if (response.ok) {
        console.log('[DEBUG-CLIENT] Delete operation successful, updating UI')
        // Remove the topic from the local state
        setTopics(topics.filter(topic => topic.id !== topicToGiveUp.id))

        // Close the modal
        setShowConfirmModal(false)
        setTopicToGiveUp(null)
      } else {
        console.error('[DEBUG-CLIENT] Failed to delete topic:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        })
      }
    } catch (error) {
      // Get detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : String(error);

      console.error('[DEBUG-CLIENT] Exception in delete operation:', {
        message: errorMessage,
        stack: errorStack,
        type: error instanceof Error ? error.constructor.name : typeof error
      })
    }
  }

  // Function to handle regenerating the cat rating when clicked
  const handleRegenerateCatRating = async () => {
    if (!profile || isCatRatingLoading) return

    setIsCatRatingLoading(true)

    try {
      // Prepare data about the user's study habits
      const studyData = {
        username: profile.username || 'User',
        daysSinceSignup: profile.created_at ? calculateDaysSinceSignup(profile.created_at) : 1,
        totalTopics: topics.length,
        completedTopics: topics.filter(topic => !topic.is_active).length,
        totalXp: profile.total_xp || 0,
        studyStreak: profile.study_streak || 0
      }

      // Request a cat rating from the API
      const response = await axios.post('/api/chat', {
        message: `Generate a humorous cat-like roast (max 2 sentences) about this user's study habits: 
        They've been signed up for ${studyData.daysSinceSignup} days, 
        have ${studyData.totalTopics} courses with ${studyData.completedTopics} completed, 
        ${studyData.studyStreak} day study streak, and ${studyData.totalXp} XP. 
        If they haven't studied much, urge them to start. Be snarky but encouraging.`
      })

      if (response.data && response.data.response) {
        const newRating = response.data.response
        setCatRating(newRating)

        // Save both the current date and the rating message
        if (user && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(`lastCatRating_date_${user.id}`, new Date().toISOString())
          localStorage.setItem(`lastCatRating_message_${user.id}`, newRating)
        }
      } else {
        setCatRating("Meow... I'm judging your study habits silently.")
      }
    } catch (error) {
      console.error('Error generating cat rating:', error)
      setCatRating("Error loading cat rating. The cat is probably napping.")
    } finally {
      setIsCatRatingLoading(false)
    }
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12 relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          className="absolute min-w-full min-h-full object-cover opacity-20"
        >
          <source src="/gradient_1080p.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-indigo-900/10"></div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Course?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{topicToGiveUp?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmModal(false)
                  setTopicToGiveUp(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleGiveUp}
              >
                Yes, Give Up
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with user greeting */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Your Courses</h1>
          {profile ? (
            <div className="flex items-center">
              <span className="text-gray-700">{greeting}, </span>
              <span className="text-purple-600 font-medium ml-1">{profile.display_name || profile.username}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-gray-700">{greeting}, </span>
              <span className="text-purple-600 font-medium ml-1">{user?.email?.split('@')[0] || 'New User'}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
        {/* User Stats Section */}
        <div className="bg-white/90 backdrop-blur-sm shadow rounded-lg mb-8">
          <div className="px-6 py-5">
            <h2 className="text-lg font-medium text-gray-900">Your Stats</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-gray-50/90 backdrop-blur-sm overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Level</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                    {profile ? calculateLevel(profile.total_xp) : 1}
                  </dd>
                </div>
              </div>
              <div className="bg-gray-50/90 backdrop-blur-sm overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Days Since Signup</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                    {profile && profile.created_at ? calculateDaysSinceSignup(profile.created_at) : 1}
                  </dd>
                </div>
              </div>
              <div className="bg-gray-50/90 backdrop-blur-sm overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Courses Completed</dt>
                  <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                    {topics.filter(topic => !topic.is_active).length}
                  </dd>
                </div>
              </div>
            </div>

            {/* Cat Rating */}
            <div className="mt-6 bg-gray-50/90 backdrop-blur-sm overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Cat Rating</dt>
                <dd 
                  className="mt-2 text-lg text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleRegenerateCatRating()}
                >
                  {isCatRatingLoading ? (
                    "The cat is judging you..."
                  ) : (
                    catRating || "Meow... I'm judging your study habits silently."
                  )}
                </dd>
              </div>
            </div>

            {/* Show profile creation message if profile is null */}
            {!profile && (
              <div className="mt-6 bg-yellow-50/90 backdrop-blur-sm border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  We're setting up your profile. If this message persists, please refresh the page or contact support.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Courses Section */}
        <div className="mb-6 flex justify-between items-center">
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 w-full mx-auto">
          {/* Course Cards */}
          {topics.filter(topic => topic.is_active).map((topic) => (
            <Card key={topic.id} className="hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
                <CardDescription>
                  {topic.difficulty_level.charAt(0).toUpperCase() + topic.difficulty_level.slice(1)} • 
                  {topic.is_active ? ' Active' : ' Inactive'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{topic.description || 'No description available.'}</p>

                {/* Additional Info */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(topic.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {new Date(topic.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">45% Complete</div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push(`/course/${topic.id}`)}
                >
                  Continue Learning
                </Button>

                {topic.is_active && (
                  <Button 
                    variant="outline" 
                    className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                    onClick={() => {
                      setTopicToGiveUp(topic)
                      setShowConfirmModal(true)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Give Up
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}

          {/* Add New Course Card */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors bg-gray-50/90 backdrop-blur-sm hover:bg-gray-100/90">
            <CardContent className="flex flex-col items-center justify-center h-full py-12">
              <PlusCircle className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Add New Course</h3>
              <p className="mt-1 text-sm text-gray-500 text-center">
                Upload a PDF or paste text to create a new learning course
              </p>
              <Button 
                className="mt-6" 
                onClick={() => router.push('/get-started')}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
