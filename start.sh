#!/bin/bash

# Define the repository URL
REPO_URL="https://github.com/fragmetal/RelayJS.git"

# Check if the .git directory exists
if [ ! -d ".git" ]; then
    echo "Initializing repository..."
    git init
    git remote add origin "$REPO_URL"
    git fetch
    git checkout -t origin/main  # Adjust branch name if necessary
else
    echo "Pulling latest changes..."
    git fetch
    git reset --hard origin/main  # Overwrite local changes
fi

# Check and install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi
clear
# Start the application
npm run start
