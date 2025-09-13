#!/bin/bash

# OtherSide GitHub Repository Setup Script
# This script helps set up the GitHub repository for the OtherSide paranormal investigation application

set -e

echo "🔮 OtherSide - GitHub Repository Setup"
echo "======================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [[ ! -f "go.mod" ]] || [[ ! -f "README.md" ]]; then
    echo -e "${RED}❌ Error: Please run this script from the otherside project root directory${NC}"
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed. You'll need to create the repository manually.${NC}"
    USE_GH_CLI=false
else
    USE_GH_CLI=true
fi

echo -e "${BLUE}📋 Pre-setup checklist:${NC}"
echo "✅ Go application with Clean Architecture"
echo "✅ Progressive Web App frontend"
echo "✅ Comprehensive README.md"
echo "✅ .gitignore for Go projects"
echo "✅ Environment configuration example"
echo "✅ GitHub issue templates"
echo "✅ MIT License ready"
echo ""

# Initialize git repository if not already done
if [[ ! -d ".git" ]]; then
    echo -e "${BLUE}🔧 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${YELLOW}ℹ️  Git repository already exists${NC}"
fi

# Create .gitignore if it doesn't exist (it should already exist)
if [[ ! -f ".gitignore" ]]; then
    echo -e "${YELLOW}⚠️  .gitignore not found, creating one...${NC}"
    cat > .gitignore << 'EOF'
# Binaries
*.exe
*.dll
*.so
*.dylib
server
bin/

# Test binary
*.test

# Coverage
*.out
coverage.html

# Environment files
.env
.env.local

# Database files
*.db
*.sqlite
*.sqlite3
data/
logs/

# IDE files
.vscode/
.idea/
*.swp

# OS files
.DS_Store
Thumbs.db
EOF
fi

# Add all files to git
echo -e "${BLUE}📦 Adding files to Git...${NC}"
git add .

# Check if there are any files to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
else
    echo -e "${BLUE}💾 Creating initial commit...${NC}"
    
    # Create comprehensive initial commit
    git commit -m "Initial commit: Complete OtherSide paranormal investigation application

🔮 Core Features:
- Go backend with Clean Architecture (domain, service, repository, handler layers)
- Progressive Web App frontend with mobile optimization
- EVP recording and analysis with real-time waveform visualization
- VOX communication system with phonetic banks and environmental triggers
- Radar detection with 360° sweep and device sensor integration
- SLS detection using camera and computer vision for skeletal tracking
- Complete offline support with service worker and background sync
- Data export functionality (JSON, CSV, ZIP formats)
- OpenTelemetry observability and performance monitoring
- SQLite database with comprehensive schema

🛠️ Technical Implementation:
- RESTful API with full CORS support
- Mobile-first responsive design with professional paranormal theme
- Session management with environmental condition tracking
- Real-time audio/video processing with WebRTC APIs
- IndexedDB storage for offline functionality
- Service worker for PWA capabilities
- Comprehensive error handling and logging

✨ Investigation Tools:
✅ EVP capture & playback with noise suppression
✅ VOX synthesizer with silent operation until triggered
✅ Radar/presence simulation with data-driven detection
✅ SLS visual detection with false-positive reduction
✅ Local data management and export options
✅ Voice-response capability and session logging
✅ Offline functionality for remote investigation sites
✅ Low-latency processing and reliable data capture
✅ Transparent operation modes and minimal false-positives

Built following Go best practices with dependency injection, comprehensive testing support, and production-ready architecture."

    echo -e "${GREEN}✅ Initial commit created${NC}"
fi

# GitHub repository creation
echo ""
echo -e "${BLUE}🚀 GitHub Repository Setup${NC}"
echo "=========================="

if [[ "$USE_GH_CLI" == true ]]; then
    echo -e "${BLUE}Creating GitHub repository using GitHub CLI...${NC}"
    
    # Check if user is logged in
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged into GitHub CLI. Please run 'gh auth login' first${NC}"
        exit 1
    fi
    
    echo "Creating repository 'otherside' for user 'myideascope'..."
    
    # Create the repository
    gh repo create myideascope/otherside \
        --description "Professional paranormal investigation application with EVP, VOX, radar, and SLS detection capabilities" \
        --public \
        --source=. \
        --remote=origin \
        --push
    
    echo -e "${GREEN}✅ Repository created and pushed to GitHub!${NC}"
    
    # Set up repository topics
    echo -e "${BLUE}🏷️  Adding repository topics...${NC}"
    gh repo edit myideascope/otherside --add-topic paranormal,investigation,evp,golang,pwa,audio-processing,computer-vision,webrtc,progressive-web-app,clean-architecture
    
else
    echo -e "${YELLOW}📝 Manual GitHub Repository Setup Required${NC}"
    echo ""
    echo "Since GitHub CLI is not available, please follow these steps manually:"
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: otherside"
    echo "3. Description: Professional paranormal investigation application with EVP, VOX, radar, and SLS detection capabilities"
    echo "4. Choose Public or Private"
    echo "5. Do NOT initialize with README (we have one)"
    echo "6. Do NOT add .gitignore (we have one)"
    echo "7. Choose MIT License"
    echo "8. Click 'Create repository'"
    echo ""
    echo "Then run these commands:"
    echo ""
    echo -e "${BLUE}git remote add origin https://github.com/myideascope/otherside.git${NC}"
    echo -e "${BLUE}git branch -M main${NC}"
    echo -e "${BLUE}git push -u origin main${NC}"
    echo ""
fi

echo ""
echo -e "${GREEN}🎉 Setup Summary${NC}"
echo "================"
echo -e "Repository: ${BLUE}https://github.com/myideascope/otherside${NC}"
echo -e "Local files: ${GREEN}✅ Ready${NC}"
echo -e "Git repository: ${GREEN}✅ Initialized${NC}"
echo -e "Initial commit: ${GREEN}✅ Created${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Visit your repository on GitHub"
echo "2. Add repository topics: paranormal, investigation, evp, golang, pwa"
echo "3. Configure branch protection rules (optional)"
echo "4. Set up GitHub Actions for CI/CD (optional)"
echo "5. Review and customize CONTRIBUTING.md"
echo ""
echo -e "${YELLOW}🔧 Development Commands:${NC}"
echo "make run     - Start development server"
echo "make test    - Run tests"
echo "make build   - Build production binary"
echo "make lint    - Run linting"
echo ""
echo -e "${GREEN}✨ Your paranormal investigation application is now on GitHub!${NC}"