'use client'

import Link from 'next/link'
import styles from '../styles.module.css'
import GradientCard from '../../components/GradientCard'

export default function AppRouterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-4xl font-bold mb-4 text-indigo-600">UpSkill App Router Test</h1>
      <p className="text-xl text-gray-600 mb-8">Testing if Tailwind CSS is working in the App Router.</p>

      <div className={styles.container}>
        <h3 className={styles.heading}>CSS Module Test</h3>
        <p className={styles.text}>This is a test to see if CSS modules are working properly.</p>
      </div>

      <div className="my-8 w-full max-w-md">
        <GradientCard title="Custom Utility Classes Test">
          <p>This card uses the custom bg-gradient and text-shadow utility classes.</p>
        </GradientCard>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors">
          Go to Home Page
        </Link>
        <Link href="/dashboard" className="custom-button shadow-md">
          Try Custom Button
        </Link>
      </div>
    </div>
  )
}
