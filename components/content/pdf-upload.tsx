'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { uploadFile, getPublicUrl } from '@/lib/utils/supabase-client'

interface PDFUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void
  maxSizeMB?: number
}

export function PDFUpload({ onUploadComplete, maxSizeMB = 10 }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadComplete, setUploadComplete] = useState(false)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)

    // Check if any files were dropped
    if (acceptedFiles.length === 0) {
      return
    }

    const file = acceptedFiles[0]

    // Check file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds the ${maxSizeMB}MB limit`)
      return
    }

    setFile(file)
    setUploadComplete(false)
  }, [maxSizeBytes, maxSizeMB])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 100)

      // Generate a unique file path
      const timestamp = Date.now()
      const filePath = `uploads/${timestamp}-${file.name.replace(/\s+/g, '_')}`

      // Upload to Supabase Storage
      const result = await uploadFile('pdfs', filePath, file)

      clearInterval(progressInterval)

      if (!result) {
        throw new Error('Upload failed')
      }

      // Get the public URL
      const publicUrl = getPublicUrl('pdfs', filePath)

      setUploadProgress(100)
      setUploadComplete(true)
      onUploadComplete(publicUrl, file.name)
    } catch (error: any) {
      setError(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setUploadComplete(false)
    setUploadProgress(0)
    setError(null)
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-3">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse files (max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-500" />
              <div>
                <p className="font-medium truncate max-w-xs">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {uploading && (
            <div className="mb-4">
              <Progress value={uploadProgress} className="h-2 mb-2" />
              <p className="text-sm text-gray-500 text-right">
                {uploadProgress}%
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 mb-4 p-2 bg-red-50 rounded">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {uploadComplete ? (
            <div className="flex items-center gap-2 text-green-500 p-2 bg-green-50 rounded">
              <Check className="h-5 w-5" />
              <p className="text-sm">Upload complete!</p>
            </div>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full touch-target"
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
