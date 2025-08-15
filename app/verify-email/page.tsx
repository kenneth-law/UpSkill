import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Verify Email | UpSkill',
  description: 'Verify your email address to activate your UpSkill account',
}

export default function VerifyEmailPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent you a verification link
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              A verification link has been sent to your email address. Please check your inbox and click the link to activate your account.
            </p>
            <p className="text-sm text-gray-500">
              If you don't see the email, check your spam folder or junk mail.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 items-center justify-center">
            <Link href="/login" className="w-full">
              <Button className="w-full">
                Return to Login
              </Button>
            </Link>
            <p className="text-sm text-gray-600">
              Didn't receive an email?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                Try signing in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}