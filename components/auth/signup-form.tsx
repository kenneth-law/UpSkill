'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/utils/supabase'
import { useToast } from '@/hooks/use-toast'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      // Sign up with Supabase Auth
      await signUp(email, password)

      // Get the user ID from the newly created user
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Create a user profile with the username
        const { error: profileError } = await supabase
          .from('users_profile')
          .insert({
            id: user.id,
            username,
            display_name: username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          throw new Error('Failed to create user profile')
        }

        // Show a toast notification before redirecting
        toast({
          variant: "success",
          title: "Account created!",
          description: "Please check your email for a verification link.",
          duration: 5000,
        })

        // Redirect to verification page immediately
        router.push('/verify-email')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Join UpSkill and start your learning journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="coollearner123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="touch-target"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="touch-target"
            />
            <p className="text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-sm text-green-500 bg-green-50 rounded-md">
              {successMessage}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6 text-lg touch-target"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
