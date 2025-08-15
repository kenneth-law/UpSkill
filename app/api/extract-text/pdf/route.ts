import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Get the user's session using the server client with proper cookie handling
    const supabaseClient = await createServerClient()
    const { data: { session } } = await supabaseClient.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Check if the request is a multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check if the file is a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/\s+/g, '_')}`
    const filePath = `pdf-extracts/${userId}/${filename}`

    // Ensure the user's directory exists
    const { data: dirData, error: dirError } = await supabase.storage
      .from('uploads')
      .list(`pdf-extracts/${userId}`)

    if (dirError && dirError.message !== 'The resource was not found') {
      console.error('Error checking directory:', dirError)
    }

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    const fileUrl = urlData.publicUrl

    // Use a PDF parsing service or library to extract text
    // For this example, we'll use a mock implementation
    // In a real implementation, you would use a library like pdf-parse or a service like AWS Textract

    // Mock implementation - in a real app, replace this with actual PDF parsing
    const extractedText = `This is extracted text from ${file.name}. 
    In a real implementation, this would contain the actual content of the PDF file.
    You would use a library like pdf-parse or a service like AWS Textract to extract the text.`

    // Store the extracted text in Supabase
    const { error: insertError } = await supabase
      .from('extracted_texts')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_url: fileUrl,
        text_content: extractedText,
        source_type: 'pdf',
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error storing extracted text:', insertError)
      // Continue anyway, as we still have the extracted text to return
    }

    // Return the extracted text
    return NextResponse.json({ text: extractedText })
  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}
