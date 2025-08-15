# API Setup Instructions

This document provides instructions for setting up the required API keys to use UpSkill with real API services instead of demo mode.

## Required API Keys

UpSkill requires the following API keys:

1. **Supabase** - For authentication and database
2. **OpenAI** - For AI-powered content generation and analysis

## Supabase Setup

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Once your project is created, go to Project Settings > API
4. Copy the following values:
   - **Project URL** - Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** - Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** - Use as `SUPABASE_SERVICE_KEY`
5. Set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `lib/database/schema.sql`
   - Paste and run the SQL in the Supabase SQL Editor

## OpenAI Setup

1. Create an OpenAI account at [https://platform.openai.com](https://platform.openai.com)
2. Go to API Keys in your account settings
3. Create a new API key
4. Copy the API key and use it as `OPENAI_API_KEY`

## Optional: Anthropic (Claude) Setup

If you want to use Claude as an alternative AI model:

1. Create an Anthropic account at [https://www.anthropic.com](https://www.anthropic.com)
2. Request API access
3. Once approved, create an API key
4. Copy the API key and use it as `ANTHROPIC_API_KEY`

## Updating Your .env.local File

1. Open the `.env.local` file in the root of the project
2. Replace the placeholder values with your actual API keys:

```
# Demo Mode Disabled
NEXT_PUBLIC_DEMO_MODE=false

# Supabase API keys
NEXT_PUBLIC_SUPABASE_URL=your-actual-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
SUPABASE_SERVICE_KEY=your-actual-supabase-service-key

# OpenAI API key
OPENAI_API_KEY=your-actual-openai-api-key

# Optional: Anthropic for Claude
ANTHROPIC_API_KEY=your-actual-anthropic-api-key
```

3. Save the file

## OAuth Provider Setup

If you want to enable social login (Google, Apple) in your application:

1. Follow the instructions in [OAUTH_SETUP.md](./OAUTH_SETUP.md) to enable and configure OAuth providers in your Supabase project.

## Testing Your Setup

1. Restart the development server:
   ```
   npm run dev
   ```
2. Visit [http://localhost:3000](http://localhost:3000) in your browser
3. Try to sign up or log in to test Supabase authentication
4. Try to create a new topic to test OpenAI integration
5. If you've configured OAuth providers, try signing in with Google or Apple

If you encounter any issues, check the browser console and server logs for error messages.
