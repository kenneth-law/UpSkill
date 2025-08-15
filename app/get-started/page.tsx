'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import catVideo from '@/components/media/cat_720p.mp4'

export default function GetStartedPage() {
  const [topic, setTopic] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim()) {
      // Redirect to the plan-study page with the topic as a URL parameter
      router.push(`/plan-study?topic=${encodeURIComponent(topic)}`)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
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
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 via-indigo-800/60 to-blue-900/70"></div>
      </div>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center z-10 px-4">
        <motion.div 
          className="max-w-2xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white text-center">
            Alright Meatbag... what do you want to study?
          </h1>
          <p className="text-lg text-gray-200 mb-8 text-center">
            One or a few words is fine, you'll have a chance to plan your time commitment and upload your own material in the next page.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Machine Learning, Elvish, Quantum Entanglement, How to haunt your enemies after death..."
                className="w-full py-6 px-4 text-lg bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-xl shadow-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
              disabled={!topic.trim()}
            >
              Let's Get Started
            </Button>
          </form>
        </motion.div>
      </div>
    </main>
  )
}
