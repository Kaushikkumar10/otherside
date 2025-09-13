# OtherSide - GitHub Repository Setup Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and log into your account (`myideascope`)
2. Click the "+" icon in the top right corner and select "New repository"
3. Fill in the repository details:
   - **Repository name**: `otherside`
   - **Description**: `Professional paranormal investigation application with EVP, VOX, radar, and SLS detection capabilities`
   - **Visibility**: Choose Public or Private based on your preference
   - **Initialize**: Do NOT check "Add a README file" (we already have one)
   - **Add .gitignore**: None (we have a custom one)
   - **Choose a license**: MIT License (recommended for open source)

4. Click "Create repository"

## Step 2: Repository Configuration

After creating the repository, GitHub will show you setup instructions. Use these commands:

### Connect Local Repository to GitHub

```bash
cd otherside

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete OtherSide paranormal investigation application

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
- Mobile-first responsive design with professional paranormal theme
- RESTful API with full CORS support
- Session management with environmental condition tracking

Features implemented per requirements:
✅ EVP capture & playback with noise suppression
✅ VOX synthesizer with silent operation until triggered
✅ Radar/presence simulation with data-driven detection
✅ SLS visual detection with false-positive reduction
✅ Local data management and export options
✅ Voice-response capability and session logging
✅ Offline functionality for remote investigation sites
✅ Low-latency processing and reliable data capture
✅ Transparent operation modes and minimal false-positives"

# Add remote origin (replace with your actual repository URL)
git remote add origin https://github.com/myideascope/otherside.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Repository Settings

After pushing, configure your repository:

1. **Branch Protection**:
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Require pull request reviews
   - Require status checks to pass

2. **Topics/Tags** (Settings → General):
   - `paranormal`
   - `investigation`
   - `evp`
   - `golang`
   - `pwa`
   - `audio-processing`
   - `computer-vision`

3. **Description and Website**:
   - Description: "Professional paranormal investigation application with EVP, VOX, radar, and SLS detection"
   - Website: Your deployment URL (if deployed)

## Step 4: Additional Repository Setup

### Create Issue Templates

Create `.github/ISSUE_TEMPLATE/` directory with templates for:
- Bug reports
- Feature requests  
- Investigation tool requests

### Create Pull Request Template

Create `.github/pull_request_template.md` for consistent PR format.

### GitHub Actions (Optional)

Set up CI/CD pipeline with:
- Go testing and linting
- Security scanning
- Automated builds
- Cross-platform testing

## Step 5: Documentation

Your repository now includes:
- ✅ Comprehensive README.md
- ✅ CONTRIBUTING.md guidelines  
- ✅ Proper .gitignore for Go projects
- ✅ Makefile for common operations
- ✅ Environment configuration example

## Repository Structure

```
otherside/
├── .github/              # GitHub templates and workflows
├── cmd/server/           # Application entry point
├── internal/             # Core application logic
│   ├── config/          # Configuration management
│   ├── domain/          # Domain models and interfaces
│   ├── service/         # Business logic layer
│   ├── repository/      # Data access layer
│   └── handler/         # HTTP handlers
├── pkg/audio/           # Audio processing utilities
├── web/static/          # PWA frontend files
├── configs/             # Database schema
├── docs/                # Documentation
├── .gitignore           # Git ignore rules
├── .env.example         # Environment configuration template
├── Makefile             # Build and development commands
├── README.md            # Project documentation
├── CONTRIBUTING.md      # Contribution guidelines
└── go.mod              # Go module definition
```

## Quick Commands

Once set up, use these commands for development:

```bash
# Start development server
make run

# Run tests
make test

# Build for production
make build

# Set up development environment
make dev-setup

# Reset database
make db-reset
```

---

**Your repository URL will be**: `https://github.com/myideascope/otherside`

Follow the steps above to get your paranormal investigation application on GitHub!