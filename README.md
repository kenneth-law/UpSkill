# UpSkill Application

## About UpSkill

UpSkill is an innovative learning application that transforms any learning content into engaging, gamified micro-learning experiences. With our sarcastic cat mascot, we make studying addictive and effective.

### Key Features
- **AI-Powered Learning**: Our AI analyzes your content and creates personalized study plans
- **Gamified Experience**: Turn boring study sessions into engaging games
- **Adaptive Learning**: Content adapts to your skill level for optimal learning
- **Progress Tracking**: Monitor your learning journey with detailed analytics
- **Multi-format Support**: Learn from various content formats including text, PDFs, and more

## System Architecture

UpSkill is built using a modern web application architecture:

- **Frontend**: Next.js React application with TypeScript
- **Backend**: Serverless API routes using Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with social login options
- **AI Integration**: OpenAI API for content generation and analysis
- **State Management**: React hooks and context
- **Styling**: Tailwind CSS with custom components

## Learning Games

UpSkill offers five engaging game modes to make learning fun and effective:

1. **LLM Powered Flashcards**: Study with AI-generated flashcards that adapt to your learning needs. Perfect for spaced repetition and knowledge retention.

2. **Judgement Cat**: Test your knowledge with short answers judged by our sarcastic cat. Get personalized feedback with a side of attitude. Great for deep understanding and critical thinking.

3. **Adaptive Quiz**: Questions that adapt to your skill level for optimal learning. The difficulty adjusts in real-time based on your performance. Ideal for efficient learning and mastery tracking.

4. **:3 Chat**: Open chat where the cat tutors, explains, demonstrates, and asks follow-up questions through Socratic dialogue. Excellent for deep understanding and conceptual exploration.

5. **Capstone Interview**: Practice real-world application of your knowledge through simulated interviews. Perfect for testing comprehensive understanding and practical application.

## Tech Stack

- **Frontend**: Next.js 15.4, React 18.2, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI API
- **Animation**: Framer Motion
- **Data Visualization**: Recharts
- **Form Validation**: Zod
- **Testing**: Jest, React Testing Library

## How to Run

### Option 1: Demo Mode (No API Keys Required)

The easiest way to try UpSkill is to use demo mode, which uses mock data instead of real API services:

1. **Verify your system** (recommended):
```bash
cd upskill
.\verify-demo.ps1
```
This will check if your system meets all requirements and fix common issues.

2. **Run the demo script**:
```bash
.\run-demo.ps1
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

The demo script will:
- Install dependencies if needed
- Configure the environment for demo mode
- Start the development server

Once running, visit [http://localhost:3000/demo](http://localhost:3000/demo) to try the interactive games.

### Option 2: Full Setup

For the complete experience with your own data:

#### Prerequisites
- Node.js (16.x or higher)
- npm (already installed with Node.js)
- Supabase account (free tier available)
- OpenAI API key

#### Setup Steps

1. **Run the setup script**:
```bash
cd upskill
.\setup.ps1
```

2. **Configure your environment**:
   - See the detailed instructions in [API_SETUP.md](../UpSkill/upskill/API_SETUP.md) for obtaining and configuring API keys
   - Edit `.env.local` with your API keys
   - Create a Supabase project
   - Run the schema in `lib/database/schema.sql` in Supabase SQL editor
   - For social login functionality, follow the instructions in [OAUTH_SETUP.md](../UpSkill/upskill/OAUTH_SETUP.md) to enable OAuth providers

3. **Start development server**:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting
- `npm run test` - Run tests

## Performance Optimization

UpSkill implements several performance optimizations to reduce bandwidth usage and server-side costs:

### Video Compression
- Background videos are compressed to 720p resolution instead of 4K to significantly reduce bandwidth usage
- The cat_720p.mp4 file is used throughout the application instead of the original 4K version
- This optimization reduces video file sizes by approximately 70-80%

### Media Caching
- All media files (including videos) are cached with aggressive cache headers
- Cache-Control headers are set to `public, max-age=31536000, immutable` (1 year)
- This ensures that returning visitors don't need to download the same media files again
- Implemented in next.config.js for all .mp4 files

### Benefits
- Reduced bandwidth costs for both server and users
- Faster page load times, especially on mobile devices
- Lower server-side costs for media delivery
- Improved user experience with quicker initial page rendering

## Deployment

### Railway Deployment

To deploy UpSkill to Railway:

1. **Create a Railway account** at [railway.app](https://railway.app) if you don't have one

2. **Create a new project** in the Railway dashboard

3. **Connect your GitHub repository** or use the Railway CLI to deploy

4. **Set up environment variables** in the Railway dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Your Supabase service key
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `NEXT_PUBLIC_APP_URL` - Your Railway app URL (e.g., https://your-app-name.railway.app)
   - `NEXT_PUBLIC_APP_NAME` - "UpSkill" or your custom app name
   - `NEXT_PUBLIC_DEMO_MODE` - Set to "false" for production deployment

5. **Deploy your application** - Railway will automatically build and deploy your application using the configuration in `railway.json`

6. **Access your deployed application** at the URL provided by Railway

#### Troubleshooting Railway Deployment

- **Build failures**: Check the build logs in the Railway dashboard for specific errors
- **Runtime errors**: Check the logs in the Railway dashboard and ensure all environment variables are correctly set
- **Database connection issues**: Verify your Supabase credentials and ensure your Supabase project allows connections from your Railway app
- **API rate limiting**: Check if you're hitting rate limits with OpenAI or other services

## Troubleshooting

### Common Issues

#### Demo Mode Issues
- **Blank screen or page not loading**: Run `.\verify-demo.ps1` to check for missing dependencies or configuration issues
- **"Module not found" errors**: Run `npm install` to ensure all dependencies are installed
- **Game components not working**: Check browser console for errors; try clearing browser cache
- **Port 3000 already in use**: Stop other applications using port 3000 or modify `next.config.js` to use a different port

#### Full Setup Issues
- **Authentication errors**: Check API keys in `.env.local` and ensure they match your Supabase project
- **"Unsupported provider" errors**: Make sure you've enabled the OAuth providers in Supabase as described in [OAUTH_SETUP.md](../UpSkill/upskill/OAUTH_SETUP.md)
- **Database errors**: Verify Supabase configuration and ensure schema has been properly applied
- **OpenAI API errors**: Check your OpenAI API key and ensure you have sufficient quota
- **"Cannot find module" errors**: Run `npm install` to reinstall dependencies

### Advanced Troubleshooting

#### Dependency Issues
```bash
# Windows
rmdir /s /q node_modules
del package-lock.json
npm install

# macOS/Linux
rm -rf node_modules
rm package-lock.json
npm install
```

#### Environment Configuration
If you're having issues with environment variables:
1. Delete `.env.local`
2. Copy `.env.local.example` to `.env.local`
3. Edit `.env.local` with your API keys (see [API_SETUP.md](../UpSkill/upskill/API_SETUP.md) for detailed instructions)
4. Restart the development server

#### Still Having Issues?
1. Run `.\verify-demo.ps1` for automated diagnostics
2. Try demo mode first to verify the application works
3. Check the browser console for specific error messages
4. Ensure you're using Node.js version 16 or higher
