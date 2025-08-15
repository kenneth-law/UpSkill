'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, FileText, FileType, Send } from 'lucide-react'

interface FileUploadProps {
  onTextExtracted: (text: string, source: string) => void
  isProcessing?: boolean
}

export function FileUpload({ onTextExtracted, isProcessing = false }: FileUploadProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [txtFile, setTxtFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [activeTab, setActiveTab] = useState('pdf')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'txt') => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setUploadError(null)

    if (type === 'pdf') {
      if (file.type !== 'application/pdf') {
        setUploadError('Please upload a PDF file')
        return
      }
      setPdfFile(file)
    } else if (type === 'txt') {
      if (file.type !== 'text/plain') {
        setUploadError('Please upload a TXT file')
        return
      }
      setTxtFile(file)
    }
  }

  const handleTextPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value)
    setUploadError(null)
  }

  const handleSubmit = async () => {
    setIsUploading(true)
    setUploadError(null)
    
    try {
      let extractedText = ''
      let source = ''

      if (activeTab === 'pdf' && pdfFile) {
        // For PDF, we'll need to use a PDF parsing library on the server
        const formData = new FormData()
        formData.append('file', pdfFile)
        
        const response = await fetch('/api/extract-text/pdf', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Failed to extract text from PDF')
        }
        
        const data = await response.json()
        extractedText = data.text
        source = `PDF: ${pdfFile.name}`
      } 
      else if (activeTab === 'txt' && txtFile) {
        // For TXT, we can read it directly in the browser
        extractedText = await txtFile.text()
        source = `TXT: ${txtFile.name}`
      } 
      else if (activeTab === 'paste' && pastedText.trim()) {
        // For pasted text, we already have it
        extractedText = pastedText
        source = 'Pasted text'
      } 
      else {
        throw new Error(`Please ${activeTab === 'paste' ? 'enter some text' : 'select a file'} first`)
      }

      // Call the callback with the extracted text
      onTextExtracted(extractedText, source)
      
      // Reset the form
      if (activeTab === 'pdf') setPdfFile(null)
      if (activeTab === 'txt') setTxtFile(null)
      if (activeTab === 'paste') setPastedText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } 
    catch (error: any) {
      setUploadError(error.message || 'An error occurred while processing your file')
    } 
    finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
        <CardDescription>
          Upload a PDF or TXT file, or paste text directly to analyze
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pdf" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="txt" className="flex items-center gap-2">
              <FileType className="h-4 w-4" />
              TXT
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pdf" className="mt-4">
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pdf-upload">Upload PDF</Label>
                <Input
                  ref={fileInputRef}
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'pdf')}
                  className="cursor-pointer"
                />
              </div>
              {pdfFile && (
                <div className="text-sm text-gray-500">
                  Selected: {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="txt" className="mt-4">
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="txt-upload">Upload TXT</Label>
                <Input
                  ref={fileInputRef}
                  id="txt-upload"
                  type="file"
                  accept=".txt"
                  onChange={(e) => handleFileChange(e, 'txt')}
                  className="cursor-pointer"
                />
              </div>
              {txtFile && (
                <div className="text-sm text-gray-500">
                  Selected: {txtFile.name} ({Math.round(txtFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="paste-text">Paste Text</Label>
              <Textarea
                id="paste-text"
                placeholder="Paste your text here..."
                value={pastedText}
                onChange={handleTextPaste}
                className="min-h-[200px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        {uploadError && (
          <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {uploadError}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isUploading || isProcessing}
          className="w-full flex items-center gap-2"
        >
          {isUploading ? (
            'Processing...'
          ) : (
            <>
              <Send className="h-4 w-4" />
              {activeTab === 'paste' ? 'Process Text' : 'Upload & Process'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}