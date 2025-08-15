#!/bin/bash

# UpSkill Setup Script for macOS
# This script helps set up the UpSkill application

echo -e "\033[36mUpSkill Setup Script\033[0m"
echo -e "\033[36m=====================\033[0m"
echo ""

# Check if we're in the upskill directory by looking for key files
in_correct_directory=false
if [ -f "package.json" ] && [ -f "next.config.js" ]; then
    in_correct_directory=true
fi

if [ "$in_correct_directory" = false ]; then
    # We might be in the parent directory, try to find the upskill directory
    if [ -d "upskill" ]; then
        echo -e "\033[33mNavigating to upskill directory...\033[0m"
        cd upskill || exit 1
        
        # Verify we're now in the correct directory
        if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
            echo -e "\033[31mError: Could not find the necessary files in the upskill directory.\033[0m"
            exit 1
        fi
    else
        echo -e "\033[31mError: Not in the upskill directory and couldn't find it.\033[0m"
        echo -e "\033[33mPlease run this script from the upskill directory or its parent directory.\033[0m"
        exit 1
    fi
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    node_version=$(node -v)
    echo -e "\033[32m✓ Node.js is installed: $node_version\033[0m"
else
    echo -e "\033[31m✗ Node.js is not installed or not in PATH\033[0m"
    echo -e "\033[33mPlease install Node.js from https://nodejs.org/ (version 16.x or higher)\033[0m"
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    npm_version=$(npm -v)
    echo -e "\033[32m✓ npm is installed: $npm_version\033[0m"
else
    echo -e "\033[31m✗ npm is not installed or not in PATH\033[0m"
    echo -e "\033[33mnpm should be installed with Node.js\033[0m"
    exit 1
fi

echo ""
echo -e "\033[36mInstalling dependencies...\033[0m"
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[31m✗ Failed to install dependencies\033[0m"
    exit 1
fi
echo -e "\033[32m✓ Dependencies installed successfully\033[0m"

# Check if .env.local exists, if not create it from example
if [ ! -f .env.local ]; then
    echo ""
    echo -e "\033[36mSetting up environment variables...\033[0m"
    
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo -e "\033[32m✓ Created .env.local from example file\033[0m"
        echo -e "\033[33mPlease edit .env.local to add your API keys\033[0m"
    else
        echo -e "\033[31m✗ .env.local.example not found\033[0m"
        # Create a basic .env.local file
        cat > .env.local << EOL
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="UpSkill"
EOL
        
        echo -e "\033[32m✓ Created basic .env.local file\033[0m"
        echo -e "\033[33mPlease edit .env.local to add your API keys\033[0m"
    fi
fi

echo ""
echo -e "\033[32mSetup completed!\033[0m"
echo ""
echo -e "\033[36mNext steps:\033[0m"
echo -e "1. Make sure you've added your API keys to .env.local"
echo -e "2. Create a Supabase project and run the schema in lib/database/schema.sql"
echo -e "3. Run 'npm run dev' to start the development server"
echo -e "4. Open http://localhost:3000 in your browser"
echo ""

read -p "Would you like to start the development server now? (y/n) " start_now
if [ "$start_now" = "y" ] || [ "$start_now" = "Y" ]; then
    echo -e "\033[36mStarting development server...\033[0m"
    npm run dev
elif [ "$start_now" = "./run-demo.sh" ] || [[ "$start_now" == *"run-demo.sh"* ]]; then
    # Handle the case where the user types the script name instead of y/n
    echo -e "\033[36mDetected demo script name as input. Starting demo mode instead...\033[0m"
    
    # Check if run-demo.sh exists in the current directory
    if [ -f "run-demo.sh" ]; then
        # Run the script directly without any additional commands
        # that might be in the input
        bash "./run-demo.sh"
    else
        echo -e "\033[31mError: run-demo.sh not found in the current directory.\033[0m"
        exit 1
    fi
elif [ "$start_now" = "npm run dev" ]; then
    # Handle the case where the user types the npm command directly
    echo -e "\033[36mStarting development server...\033[0m"
    npm run dev
else
    echo -e "\033[33mYou can start the server later with 'npm run dev'\033[0m"
    echo -e "\033[33mOr run the demo with './run-demo.sh'\033[0m"
fi