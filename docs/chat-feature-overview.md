# :3 Chat Feature Documentation

## Overview
The :3 chat feature is an interactive learning system that provides users with a cat-like AI tutor named ":3" to guide them through educational content. The system supports both text-based chat and real-time voice interactions, enabling a flexible and engaging learning experience.

## System Architecture

### Components
1. **Text-based Chat**
   - Frontend UI (`/app/chat/page.tsx`)
   - Chat API endpoint (`/app/api/chat/route.ts`)
   - Uses GPT-5-mini-2025-08-07 model

2. **Voice-based Chat**
   - Chat Supervisor component (`/app/components/chat-supervisor.tsx`)
   - Realtime Voice API endpoint (`/app/api/realtime-voice/route.ts`)
   - Realtime API utilities (`/lib/utils/realtime-api.ts`)
   - Uses GPT-4o-realtime-preview model

3. **Game Components**
   - Judgement Cat (`/components/games/judgement-cat.tsx`)
   - Other educational game components

4. **Database**
   - Supabase for session storage and user data
   - Tables: chat_logs, game_sessions

### Data Flow
1. User initiates a chat session (text or voice)
2. Request is sent to the appropriate API endpoint
3. API communicates with OpenAI
4. Responses are streamed back to the user
5. Session data is stored in Supabase (if user is authenticated)

## Text-based Chat Feature

### Session Creation
1. User navigates to the chat page with query parameters (courseId, lessonId, topic, goals)
2. Initial welcome message is displayed
3. When user sends a message, a POST request is sent to `/api/chat`
4. The API generates a system prompt based on the topic and goals
5. The API calls OpenAI with streaming enabled
6. Responses are streamed back to the UI
7. Chat logs are stored in the `chat_logs` table in Supabase

### System Prompt
The system prompt defines :3's personality and behavior:
```
You are a cat tutor named :3 who guides students through Socratic dialogue. Your approach is to:
1. Explain concepts clearly and thoroughly
2. Demonstrate with examples when helpful
3. Ask thoughtful follow-up questions that lead students to deeper understanding
4. Maintain a cat-like personality with occasional witty remarks and cat puns
5. Guide rather than simply provide answers - help students discover knowledge themselves
6. Build on previous exchanges to create a coherent learning journey
7. Adjust your explanations based on the student's responses and understanding level
```

### Competency Scoring
- Each interaction increases the user's competency score
- When the score reaches 100, the user can progress to the next level
- Currently uses a simple random score generation (1-30 points per interaction)

## Voice-based Chat Feature

### Session Creation
1. `createRealtimeSession` function is called with topic and system prompt
2. Function determines if WebRTC is supported in the browser
3. POST request is sent to `/api/realtime-voice`
4. API creates a session using OpenAI's beta.realtime.sessions.create
5. Session ID is stored in the `game_sessions` table in Supabase
6. Session information is returned to the client

### Connection Establishment
1. Based on browser support, either WebRTC or WebSocket connection is established
2. For WebRTC:
   - Client creates an offer
   - Offer is sent to OpenAI via PATCH to `/api/realtime-voice`
   - Answer is received and applied
   - ICE candidates are exchanged via PUT to `/api/realtime-voice`
3. For WebSocket:
   - Direct WebSocket connection to OpenAI's realtime API
   - Audio processing using AudioWorklet

### System Prompt
The default system prompt for voice interviews:
```
You are an expert interviewer conducting a voice interview on the topic of "${topic}". 
Your goal is to help the user synthesize and demonstrate their knowledge on this subject.

# Interview Structure
1. Start with a brief introduction and explain the purpose of this capstone interview.
2. Ask 3-5 thoughtful questions that require the user to synthesize their knowledge.
3. For each response, provide constructive feedback and ask follow-up questions to deepen their understanding.
4. At the end, provide a summary of their strengths and areas for improvement.

# Guidelines
- Ask one question at a time and wait for the user's response.
- Your questions should encourage critical thinking and knowledge synthesis.
- Provide constructive feedback that acknowledges strengths and suggests improvements.
- Maintain a professional and encouraging tone throughout the interview.
- If the user struggles, provide hints or rephrase the question to help them.
```

## Game Integration: Judgement Cat

The Judgement Cat component is a quiz-like game that:
1. Presents questions to the user
2. Evaluates their answers
3. Provides feedback with a cat-like attitude
4. Tracks score and progress

This component shares the same cat-like personality as the :3 chat feature, providing a consistent experience across different learning activities.

## Database Schema

### chat_logs Table
- user_id: Foreign key to users table
- user_message: The message sent by the user
- ai_response: The response from the AI
- created_at: Timestamp

### game_sessions Table
- user_id: Foreign key to users table
- game_type: Type of game/activity (e.g., 'capstone_interview')
- score: User's score
- duration_seconds: Session duration
- mastery_gain: Mastery points gained
- xp_earned: Experience points earned
- completed: Boolean indicating if session is complete
- content: JSON object with session-specific data
- course_id: Associated course

## User Experience

### Text Chat
1. User enters the chat page with a specific topic
2. :3 introduces itself and the topic
3. User asks questions or responds to prompts
4. :3 provides explanations, examples, and follow-up questions
5. Competency score increases with each interaction
6. When competency reaches 100, user can progress to next level

### Voice Chat
1. User initiates a voice interview session
2. System establishes connection with OpenAI
3. :3 introduces the interview format
4. User speaks responses to questions
5. :3 provides feedback and asks follow-up questions
6. At the end, :3 summarizes strengths and areas for improvement

## Technical Considerations

### Error Handling
- Both API endpoints include comprehensive error handling
- Errors are logged with detailed information
- User-friendly error messages are displayed in the UI

### Authentication
- Authentication is optional but recommended
- Authenticated users have their sessions stored in the database
- Unauthenticated users can still use the feature with temporary session IDs

### Performance
- Responses are streamed for better user experience
- WebRTC is used when supported for better voice quality
- Fallback to WebSocket when WebRTC is not available

## Future Enhancements
- Implement more sophisticated competency scoring based on response quality
- Add support for multi-modal interactions (text, voice, and images)
- Enhance the supervisor functionality for complex tasks
- Improve voice recognition and processing
- Add support for different languages and accents