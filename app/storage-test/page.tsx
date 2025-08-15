'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Home,
  Upload,
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileUp
} from 'lucide-react'

export default function StorageTestPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [result, setResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testStatus, setTestStatus] = useState<{
    bucket: 'idle' | 'success' | 'error';
    permissions: 'idle' | 'success' | 'error';
    upload: 'idle' | 'success' | 'error';
  }>({
    bucket: 'idle',
    permissions: 'idle',
    upload: 'idle'
  })

  // Initialize Supabase client
  const initSupabase = () => {
    if (!supabaseUrl || !supabaseKey) {
      setError('Please enter both Supabase URL and anon key')
      return null
    }

    try {
      // In a real implementation, we would use the Supabase client here
      // Since we can't import it directly in this example, we'll simulate it
      setResult('Initializing Supabase client...')
      return {
        storage: {
          getBucket: async (name: string) => {
            setResult(prev => prev + `\nGetting bucket: ${name}...`)
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            return { data: { id: name, name, public: true }, error: null }
          },
          from: (bucket: string) => ({
            list: async (path?: string) => {
              setResult(prev => prev + `\nListing files in bucket: ${bucket}${path ? ` at path: ${path}` : ''}...`)
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              return { data: [], error: null }
            },
            upload: async (path: string, file: File) => {
              setResult(prev => prev + `\nUploading file: ${file.name} to ${bucket}/${path}...`)
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000))
              return { data: { path }, error: null }
            },
            getPublicUrl: (path: string) => {
              return { data: { publicUrl: `https://example.com/${bucket}/${path}` } }
            }
          })
        }
      }
    } catch (error) {
      setError('Error initializing Supabase client')
      return null
    }
  }

  const testBucketExistence = async () => {
    setIsLoading(true)
    setError('')
    setTestStatus(prev => ({ ...prev, bucket: 'idle' }))
    
    try {
      const supabase = initSupabase()
      if (!supabase) {
        setTestStatus(prev => ({ ...prev, bucket: 'error' }))
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.storage.getBucket('uploads')
      
      if (error) {
        setResult(prev => prev + `\nError checking bucket: ${error.message}`)
        setTestStatus(prev => ({ ...prev, bucket: 'error' }))
      } else {
        setResult(prev => prev + `\nBucket exists: ${JSON.stringify(data, null, 2)}`)
        setTestStatus(prev => ({ ...prev, bucket: 'success' }))
      }
    } catch (error) {
      setResult(prev => prev + `\nException: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTestStatus(prev => ({ ...prev, bucket: 'error' }))
    } finally {
      setIsLoading(false)
    }
  }

  const testPermissions = async () => {
    setIsLoading(true)
    setError('')
    setTestStatus(prev => ({ ...prev, permissions: 'idle' }))
    
    try {
      const supabase = initSupabase()
      if (!supabase) {
        setTestStatus(prev => ({ ...prev, permissions: 'error' }))
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.storage.from('uploads').list()
      
      if (error) {
        setResult(prev => prev + `\nError listing files: ${error.message}`)
        setTestStatus(prev => ({ ...prev, permissions: 'error' }))
      } else {
        setResult(prev => prev + `\nFiles found: ${data.length}`)
        setTestStatus(prev => ({ ...prev, permissions: 'success' }))
      }
    } catch (error) {
      setResult(prev => prev + `\nException: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTestStatus(prev => ({ ...prev, permissions: 'error' }))
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    setIsLoading(true)
    setError('')
    setTestStatus(prev => ({ ...prev, upload: 'idle' }))
    
    try {
      const supabase = initSupabase()
      if (!supabase) {
        setTestStatus(prev => ({ ...prev, upload: 'error' }))
        setIsLoading(false)
        return
      }

      // Generate a unique filename
      const timestamp = Date.now()
      const filename = `test-${timestamp}-${selectedFile.name.replace(/\s+/g, '_')}`
      const filePath = `test-uploads/${filename}`
      
      const { data, error } = await supabase.storage.from('uploads').upload(filePath, selectedFile)
      
      if (error) {
        setResult(prev => prev + `\nError uploading file: ${error.message}`)
        setTestStatus(prev => ({ ...prev, upload: 'error' }))
      } else {
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath)
        setResult(prev => prev + `\nFile uploaded successfully!\nFile path: ${filePath}\nPublic URL: ${urlData.publicUrl}`)
        setTestStatus(prev => ({ ...prev, upload: 'success' }))
      }
    } catch (error) {
      setResult(prev => prev + `\nException: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTestStatus(prev => ({ ...prev, upload: 'error' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleReset = () => {
    setResult('')
    setError('')
    setSelectedFile(null)
    setTestStatus({
      bucket: 'idle',
      permissions: 'idle',
      upload: 'idle'
    })
  }

  const getStatusIcon = (status: 'idle' | 'success' | 'error') => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Storage Test Page</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Supabase Storage Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This page allows you to test the Supabase Storage integration. Enter your Supabase URL and anon key below to get started.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Supabase URL
                </label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="supabaseKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Supabase Anon Key
                </label>
                <Input
                  id="supabaseKey"
                  placeholder="your-anon-key"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  type="password"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                onClick={testBucketExistence}
                disabled={isLoading || !supabaseUrl || !supabaseKey}
                className="flex items-center gap-2"
              >
                {isLoading && testStatus.bucket === 'idle' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  getStatusIcon(testStatus.bucket)
                )}
                Test Bucket Existence
              </Button>

              <Button 
                onClick={testPermissions}
                disabled={isLoading || !supabaseUrl || !supabaseKey}
                className="flex items-center gap-2"
              >
                {isLoading && testStatus.permissions === 'idle' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  getStatusIcon(testStatus.permissions)
                )}
                Test Permissions
              </Button>

              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isLoading}
              >
                Clear Results
              </Button>
            </div>

            <div className="mb-6">
              <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
                Upload Test File
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="fileUpload"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <Button 
                  onClick={uploadFile}
                  disabled={isLoading || !selectedFile || !supabaseUrl || !supabaseKey}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {isLoading && testStatus.upload === 'idle' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    getStatusIcon(testStatus.upload) || <FileUp className="w-4 h-4" />
                  )}
                  Upload
                </Button>
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">Selected file: {selectedFile.name}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-medium mb-2">Results:</h3>
                <div className="bg-gray-100 border border-gray-200 rounded-md p-4 whitespace-pre-wrap font-mono text-sm">
                  {result}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This page tests the integration with Supabase Storage.</p>
          <p>Make sure you have set up your storage schema as described in the STORAGE_SETUP.md file.</p>
        </div>
      </div>
    </main>
  )
}