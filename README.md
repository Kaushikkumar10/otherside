# OtherSide - Paranormal Investigation Application

A comprehensive paranormal investigation application built with Go backend and Progressive Web App (PWA) frontend.

## Features

### Core Investigation Tools
- **EVP Recording & Analysis**: Real-time audio capture with waveform visualization and paranormal activity detection
- **VOX Communication**: Spirit communication through phonetic banks and frequency modulation
- **Radar Detection**: EMF and audio anomaly visualization with environmental monitoring
- **SLS Detection**: Camera-based skeletal tracking for entity visualization
- **Session Management**: Complete investigation session tracking and documentation

### Technical Capabilities
- **Offline Support**: Full offline functionality with automatic data synchronization
- **Real-time Processing**: Low-latency audio and video processing (<200ms)
- **Mobile Optimized**: PWA design for iOS and Android with native-like experience
- **Data Export**: Multiple export formats (JSON, CSV, ZIP) for investigation reports
- **OpenTelemetry Integration**: Comprehensive observability and performance monitoring

## Architecture

### Backend (Go)
- **Clean Architecture**: Separation of concerns with domain, service, repository, and handler layers
- **Microservices Ready**: Modular design for easy scaling and deployment
- **SQLite Database**: Local data storage with comprehensive schema
- **OpenTelemetry**: Distributed tracing and metrics collection
- **RESTful API**: Complete API for all paranormal investigation features

### Frontend (PWA)
- **Progressive Web App**: Installable on mobile devices
- **Modern Web APIs**: WebRTC, Web Audio API, Canvas API, Device Sensors
- **Service Worker**: Offline support and background synchronization
- **Responsive Design**: Mobile-first design with touch-friendly interactions
- **Real-time Visualizations**: Audio waveforms, radar sweeps, skeletal overlays

## Quick Start

### Prerequisites
- Go 1.22 or later
- Modern web browser with camera/microphone access

### Running the Application

1. Clone and build:
\`\`\`bash
git clone https://github.com/myideascope/otherside
cd otherside
go build ./cmd/server
\`\`\`

2. Start the server:
\`\`\`bash
./server
\`\`\`

3. Open your browser and navigate to \`http://localhost:8080\`

4. Grant camera and microphone permissions for full functionality

### Environment Configuration

Create a \`.env\` file or set environment variables:

\`\`\`bash
PORT=8080
ENVIRONMENT=development
DB_NAME=otherside.db
DATA_PATH=./data
AUDIO_SAMPLE_RATE=44100
NOISE_THRESHOLD=0.1
\`\`\`

## API Endpoints

### Sessions
- \`POST /api/v1/sessions\` - Create new investigation session
- \`GET /api/v1/sessions/{id}\` - Get session details and summary
- \`GET /api/v1/sessions\` - List all sessions (paginated)

### Investigation Tools
- \`POST /api/v1/sessions/{sessionId}/evp\` - Process EVP recording
- \`POST /api/v1/sessions/{sessionId}/vox\` - Generate VOX communication
- \`POST /api/v1/sessions/{sessionId}/radar\` - Process radar detection
- \`POST /api/v1/sessions/{sessionId}/sls\` - Process SLS detection
- \`POST /api/v1/sessions/{sessionId}/interactions\` - Record user interaction

### Data Export
- \`POST /api/v1/export/sessions\` - Export session data
- \`GET /api/v1/export/list\` - List available exports
- \`GET /api/v1/export/download/{filename}\` - Download export file

### Health Check
- \`GET /health\` - Application health status

## Investigation Features

### EVP (Electronic Voice Phenomenon) Recording
- Real-time audio capture with noise reduction
- Waveform visualization and frequency analysis
- Voice frequency range highlighting (85-2000 Hz)
- Playback controls: normal, slow, reverse
- Quality assessment and anomaly detection
- Annotation support for evidence documentation

### VOX Communication
- Phonetic bank synthesis for spirit communication
- Multiple language packs (English, Simple)
- Environmental trigger-based activation
- Frequency modulation with adjustable parameters
- Silent operation until triggered (no false chatter)
- Response correlation and timing analysis

### Radar Detection
- Visual radar interface with 360° sweep
- EMF and audio anomaly correlation
- Real-time environmental monitoring
- Device sensor integration (accelerometer, magnetometer)
- Position tracking and movement trails
- Configurable detection sensitivity

### SLS (Structured Light Sensor) Detection
- Camera-based skeletal tracking
- Real-time video overlay with joint visualization
- Confidence scoring and quality assessment
- Multiple filter options to reduce false positives
- Movement pattern analysis
- Bounding box and position tracking

### Session Management
- Complete investigation session lifecycle
- Environmental condition recording (temperature, humidity, pressure)
- Location tracking with GPS coordinates
- Session notes and interaction logging
- Real-time session timer and status tracking
- Comprehensive session statistics and analysis

## Project Structure

\`\`\`
otherside/
├── cmd/server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── domain/          # Domain models and interfaces
│   ├── service/         # Business logic layer
│   ├── repository/      # Data access layer
│   └── handler/         # HTTP handlers
├── pkg/
│   └── audio/           # Audio processing utilities
├── web/static/          # PWA frontend files
├── configs/             # Database schema and configurations
└── docs/                # Documentation
\`\`\`

## Security and Privacy

- **Local Storage**: All data stored locally by default
- **No External Dependencies**: Operates completely offline
- **Permission Management**: Explicit camera/microphone permission requests
- **Secure Defaults**: Conservative detection thresholds to minimize false positives
- **Data Ownership**: Users maintain complete control over investigation data

## Development

### Adding New Investigation Tools

1. Define domain models in \`internal/domain/\`
2. Create repository interface and implementation
3. Implement business logic in service layer
4. Add HTTP handlers for API endpoints
5. Create frontend modules for user interaction

### Testing

\`\`\`bash
go test ./...
\`\`\`

### Linting

\`\`\`bash
golangci-lint run
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Make your changes following the Clean Architecture patterns
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or feature requests, please open an issue on GitHub or contact the development team.

---

**Note**: This application is designed for entertainment and investigative purposes. Paranormal detection results should be interpreted with appropriate skepticism and scientific rigor.