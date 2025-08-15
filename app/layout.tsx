import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../styles/global.css'
import { AuthProvider } from '@/lib/auth/auth-provider'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { PageTransition } from '@/components/layout/page-transition'
import ErrorBoundary from '@/components/error/error-boundary'
import { Toaster } from '@/components/ui/toaster'
// Import error handler to patch webpack HMR errors
import '@/lib/utils/error-handler'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4f46e5',
}

export const metadata: Metadata = {
  title: 'UpSkill - Learn Anything, Effortlessly',
  description: 'Convert any learning content into an engaging, gamified micro-learning experience with a sarcastic cat mascot that makes studying addictive.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
