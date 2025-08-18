'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownProps {
  content: string
  className?: string
}

/**
 * A reusable component for rendering Markdown content with LaTeX support
 * 
 * @param content - The markdown content to render
 * @param className - Optional CSS class to apply to the container
 */
export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}