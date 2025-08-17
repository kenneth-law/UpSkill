# LaTeX and Markdown Implementation in UpSkill

This document describes how LaTeX and Markdown rendering was implemented across the UpSkill platform to enhance content display with mathematical expressions and formatted text.

## Overview

The implementation enables LaTeX and Markdown rendering in all generated text content sitewide, particularly in game components like flashcards and judgement-cat. This allows for:

- Mathematical expressions and formulas using LaTeX syntax
- Rich text formatting using Markdown syntax
- Consistent rendering across all components

## Libraries Used

The following libraries were integrated to enable LaTeX and Markdown rendering:

1. **react-markdown**: A React component to render Markdown
2. **remark-math**: A remark plugin to parse math in Markdown
3. **rehype-katex**: A rehype plugin to render math with KaTeX
4. **katex**: The core KaTeX library for rendering LaTeX

## Implementation Details

### 1. Package Installation

The necessary packages were installed using npm:

```bash
npm install react-markdown remark-math rehype-katex katex
```

### 2. Component Updates

#### Important Note on ReactMarkdown v10.x

As of ReactMarkdown version 10.x, the `className` prop has been removed and is no longer supported. Using the `className` prop will result in a console error. For more information, see the [React Markdown changelog](https://github.com/remarkjs/react-markdown/blob/main/changelog.md#remove-classname).

#### Flashcards Component

The flashcards component was updated to render LaTeX and Markdown content:

1. Added import statements for the required libraries
2. Added KaTeX CSS import
3. Replaced plain text rendering with ReactMarkdown components
4. Configured the ReactMarkdown component with remark-math and rehype-katex plugins

```jsx
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// In the render function:
<ReactMarkdown
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {content}
</ReactMarkdown>
```

#### Judgement Cat Component

Similar updates were made to the judgement-cat component to render LaTeX and Markdown in:
- Question text
- Explanation text
- Correct answer text

### 3. AI Prompt Updates

All AI prompts were updated to instruct the AI to output LaTeX and Markdown:

#### In generate-game-content/route.ts:

- Updated `generateFlashcardsContent` prompt
- Updated `generateConceptsFromParameters` prompt
- Updated system messages to reinforce LaTeX and Markdown usage

#### In concept-extraction.service.ts:

- Updated `extractConcepts` prompt
- Updated `generateStudyPlan` prompt
- Updated `generateQuestions` prompt
- Updated all system messages to reinforce LaTeX and Markdown usage

### 4. LaTeX Formatting Guidelines

The following guidelines were added to all AI prompts:

```
Important formatting guidelines:
- Use proper markdown formatting in your content
- Use LaTeX for mathematical expressions and formulas, enclosed in $ for inline math and $$ for block math
- Examples of LaTeX usage:
  - Inline math: $E = mc^2$
  - Block math: $$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
  - Fractions: $\frac{a}{b}$
  - Square roots: $\sqrt{x}$
  - Subscripts and superscripts: $x_i^2$
  - Greek letters: $\alpha, \beta, \gamma, \delta$
```

## Usage Examples

### LaTeX Examples

1. **Inline Math**: Use single dollar signs for inline math expressions
   ```
   The formula $E = mc^2$ is Einstein's famous equation.
   ```

2. **Block Math**: Use double dollar signs for block math expressions
   ```
   The sum of the first n natural numbers is:
   $$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
   ```

3. **Complex Formulas**: LaTeX can handle complex mathematical formulas
   ```
   The quadratic formula is:
   $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
   ```

### Markdown Examples

1. **Headings**: Use # for headings
   ```
   # Heading 1
   ## Heading 2
   ### Heading 3
   ```

2. **Emphasis**: Use * or _ for emphasis
   ```
   *italic* or _italic_
   **bold** or __bold__
   ```

3. **Lists**: Use - or * for unordered lists, and numbers for ordered lists
   ```
   - Item 1
   - Item 2
     - Subitem 2.1
     - Subitem 2.2

   1. First item
   2. Second item
   ```

## Conclusion

The implementation of LaTeX and Markdown rendering enhances the content display capabilities of the UpSkill platform, allowing for rich text formatting and mathematical expressions. This is particularly valuable for educational content that involves mathematical concepts, formulas, and structured text.
