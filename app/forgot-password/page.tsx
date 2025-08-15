import { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset Password | UpSkill',
  description: 'Reset your UpSkill account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video Background with Image Fallback */}
      <video 
        className="absolute top-0 left-0 w-full h-full object-cover z-0" 
        autoPlay 
        loop 
        muted 
        playsInline
        style={{ 
          backgroundImage: "url('/gradient.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        poster="/gradient.jpeg"
      >
        <source src="/gradient_1080p.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="container relative z-10 flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-6">
            Reset Your Password <span className="text-purple-500">:3</span>
          </h1>
          <div className="mb-4 text-center text-gray-600 italic">
            <p>Wow... Maybe write it down next time?</p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
