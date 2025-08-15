import * as pdfjs from 'pdfjs-dist'
import { TextItem } from 'pdfjs-dist/types/src/display/api'

// Initialize PDF.js worker
// In a real app, you'd want to use a proper worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export interface ExtractedPage {
  pageNumber: number
  text: string
  sections?: {
    title: string
    content: string
    level: number
  }[]
}

export interface ExtractionResult {
  title: string
  pages: ExtractedPage[]
  totalPages: number
  text: string
}

/**
 * Extracts text from a PDF file
 * @param fileUrl URL of the PDF file to extract text from
 * @returns Promise resolving to the extracted text
 */
export async function extractTextFromPDF(fileUrl: string): Promise<ExtractionResult> {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(fileUrl)
    const pdf = await loadingTask.promise
    
    const totalPages = pdf.numPages
    const pages: ExtractedPage[] = []
    let fullText = ''
    let documentTitle = 'Untitled Document'
    
    // Extract text from each page
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      // Extract text items and join them
      const pageText = textContent.items
        .map((item: TextItem) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      pages.push({
        pageNumber: i,
        text: pageText
      })
      
      fullText += pageText + '\n\n'
      
      // Try to extract title from first page
      if (i === 1) {
        const firstPageItems = textContent.items as TextItem[]
        if (firstPageItems.length > 0) {
          // Assume the first text item with a reasonable length could be the title
          const potentialTitles = firstPageItems
            .filter(item => item.str.length > 5 && item.str.length < 100)
            .slice(0, 3)
          
          if (potentialTitles.length > 0) {
            // Use the first potential title
            documentTitle = potentialTitles[0].str.trim()
          }
        }
      }
    }
    
    return {
      title: documentTitle,
      pages,
      totalPages,
      text: fullText
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Attempts to identify sections and structure in the extracted text
 * @param extractionResult The result from extractTextFromPDF
 * @returns The same result with sections added
 */
export async function identifySections(extractionResult: ExtractionResult): Promise<ExtractionResult> {
  try {
    const { pages } = extractionResult
    
    // Simple heuristic to identify sections based on line length and capitalization
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const lines = page.text.split('\n')
      const sections = []
      
      let currentSection = {
        title: '',
        content: '',
        level: 1
      }
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Skip empty lines
        if (!trimmedLine) continue
        
        // Heuristic for section headers:
        // 1. Short lines (less than 60 chars)
        // 2. Ends with a colon or doesn't end with punctuation
        // 3. Has more than 50% of words capitalized
        const isShort = trimmedLine.length < 60
        const endsWithColon = trimmedLine.endsWith(':')
        const noEndPunctuation = !trimmedLine.match(/[.!?]$/)
        const words = trimmedLine.split(' ')
        const capitalizedWords = words.filter(word => 
          word.length > 0 && word[0] === word[0].toUpperCase()
        )
        const mostlyCapitalized = capitalizedWords.length / words.length > 0.5
        
        const isPotentialHeader = isShort && (endsWithColon || noEndPunctuation) && mostlyCapitalized
        
        if (isPotentialHeader) {
          // If we have content in the current section, save it
          if (currentSection.title && currentSection.content) {
            sections.push({ ...currentSection })
          }
          
          // Start a new section
          currentSection = {
            title: trimmedLine,
            content: '',
            level: trimmedLine.startsWith('#') ? 
              (trimmedLine.match(/^#+/) || ['#'])[0].length : 
              1
          }
        } else {
          // Add to current section content
          if (currentSection.title) {
            currentSection.content += trimmedLine + ' '
          } else {
            // If no section title yet, use this as the title
            currentSection.title = trimmedLine
          }
        }
      }
      
      // Add the last section if it has content
      if (currentSection.title && currentSection.content) {
        sections.push(currentSection)
      }
      
      // Update the page with sections
      page.sections = sections
    }
    
    return extractionResult
  } catch (error) {
    console.error('Error identifying sections:', error)
    return extractionResult
  }
}

/**
 * Extracts text and identifies sections from a PDF file
 * @param fileUrl URL of the PDF file
 * @returns Promise resolving to the extraction result with sections
 */
export async function processPDF(fileUrl: string): Promise<ExtractionResult> {
  const extractionResult = await extractTextFromPDF(fileUrl)
  return await identifySections(extractionResult)
}