# Contributing to OtherSide

Thank you for your interest in contributing to OtherSide, the paranormal investigation application! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive in all interactions
- Focus on constructive feedback and collaboration
- Maintain professionalism while having fun with the paranormal theme
- Respect the scientific approach to paranormal investigation

## Development Environment Setup

1. **Prerequisites**:
   - Go 1.22 or later
   - Git
   - Modern web browser
   - Optional: golangci-lint, air (for hot reload)

2. **Setup**:
   ```bash
   git clone https://github.com/myideascope/otherside
   cd otherside
   make dev-setup  # Install development tools
   make init-dirs  # Create required directories
   cp .env.example .env  # Copy environment configuration
   ```

3. **Run Development Server**:
   ```bash
   make dev  # With hot reload (if air is installed)
   # OR
   make run  # Standard execution
   ```

## Architecture Guidelines

### Clean Architecture Principles

Follow the established Clean Architecture pattern:

- **Domain Layer** (`internal/domain/`): Core business entities and interfaces
- **Service Layer** (`internal/service/`): Business logic and use cases  
- **Repository Layer** (`internal/repository/`): Data access implementations
- **Handler Layer** (`internal/handler/`): HTTP transport layer

### Coding Standards

1. **Go Best Practices**:
   - Use `gofmt` and `goimports` for formatting
   - Follow effective Go guidelines
   - Write idiomatic Go code with proper error handling
   - Use meaningful variable and function names

2. **Error Handling**:
   ```go
   if err != nil {
       return fmt.Errorf("descriptive context: %w", err)
   }
   ```

3. **Context Propagation**:
   - Always pass `context.Context` as the first parameter
   - Use context for cancellation and request-scoped values
   - Propagate context through all layers

4. **Interface Design**:
   - Prefer small, focused interfaces
   - Use dependency injection
   - Write tests against interfaces, not concrete types

### Testing Requirements

1. **Unit Tests**:
   - Write tests for all public functions
   - Use table-driven tests where appropriate
   - Mock external dependencies using interfaces
   - Aim for >80% code coverage

2. **Test Structure**:
   ```go
   func TestFunctionName(t *testing.T) {
       tests := []struct {
           name string
           input InputType
           want ExpectedType
           wantErr bool
       }{
           // test cases
       }
       
       for _, tt := range tests {
           t.Run(tt.name, func(t *testing.T) {
               // test implementation
           })
       }
   }
   ```

3. **Integration Tests**:
   - Test API endpoints end-to-end
   - Use test database for isolation
   - Test offline/online scenarios

### OpenTelemetry Guidelines

1. **Tracing**:
   - Add spans for all service methods
   - Include relevant attributes (session_id, user actions)
   - Record errors with `span.RecordError(err)`

2. **Metrics**:
   - Track key performance indicators
   - Monitor detection accuracy and response times
   - Add custom metrics for paranormal-specific events

3. **Logging**:
   - Use structured logging with consistent fields
   - Include trace IDs for correlation
   - Avoid logging sensitive information

### Frontend Guidelines

1. **PWA Standards**:
   - Maintain offline functionality
   - Follow responsive design principles
   - Ensure accessibility (WCAG 2.1 AA)
   - Optimize for mobile performance

2. **JavaScript**:
   - Use modern ES6+ features
   - Implement proper error handling
   - Use async/await for asynchronous operations
   - Add comprehensive comments for complex algorithms

3. **Audio/Video Processing**:
   - Minimize latency (<200ms requirement)
   - Handle browser compatibility issues
   - Implement proper resource cleanup
   - Respect user privacy and permissions

## Contribution Process

### 1. Issue Creation

- Check existing issues before creating new ones
- Use issue templates when available
- Provide clear reproduction steps for bugs
- Include system information and browser details

### 2. Pull Request Process

1. **Branch Naming**:
   - `feature/description` for new features
   - `bugfix/description` for bug fixes
   - `enhancement/description` for improvements
   - `docs/description` for documentation

2. **Commit Messages**:
   ```
   type(scope): brief description
   
   Longer explanation if needed, including:
   - What changed and why
   - Any breaking changes
   - Issue references (#123)
   ```

3. **PR Requirements**:
   - Link to related issue
   - Include tests for new functionality
   - Update documentation if needed
   - Ensure all CI checks pass
   - Request review from maintainers

### 3. Code Review Guidelines

- Focus on architecture, security, and performance
- Check for paranormal investigation accuracy
- Verify mobile compatibility
- Ensure offline functionality works
- Test accessibility features

## Feature Development Guidelines

### Adding New Investigation Tools

1. **Research Phase**:
   - Study real paranormal investigation practices
   - Research the scientific basis of the tool
   - Identify potential false-positive sources
   - Define clear success criteria

2. **Implementation Phase**:
   - Start with domain model and interfaces
   - Implement core algorithm with tests
   - Add API endpoints following existing patterns
   - Create frontend interface with visualizations
   - Add OpenTelemetry instrumentation

3. **Validation Phase**:
   - Test with various devices and browsers
   - Validate offline functionality
   - Check performance requirements
   - Gather feedback from paranormal investigation community

### Audio/Signal Processing Contributions

- Understand audio fundamentals and DSP concepts
- Test with various audio sources and environments
- Consider computational complexity and mobile battery usage
- Document algorithm choices and parameters
- Provide references to scientific sources

### UI/UX Contributions

- Maintain the dark, professional paranormal theme
- Ensure touch-friendly interactions for mobile
- Test in various lighting conditions (investigations often occur in dark environments)
- Consider accessibility for investigators with disabilities
- Optimize for one-handed operation during investigations

## Quality Standards

### Performance Requirements

- Audio processing latency: <200ms
- UI response time: <100ms
- Memory usage: <100MB on mobile devices
- Battery usage: Minimal impact during long investigations
- Offline sync: Complete within 30 seconds when online

### Security Requirements

- No external data transmission without explicit user consent
- Secure local storage of sensitive investigation data
- Proper input validation and sanitization
- Protection against common web vulnerabilities

### Reliability Requirements

- Application must not crash during recordings
- Data must be preserved even if app is force-closed
- Graceful degradation when hardware features unavailable
- Robust error recovery and user feedback

## Documentation Standards

- Update README.md for new features
- Include inline code comments for complex algorithms
- Provide API documentation for new endpoints
- Add user documentation for new investigation tools
- Include troubleshooting guides for common issues

## Release Process

1. **Pre-release Checklist**:
   - All tests passing
   - Performance benchmarks met
   - Security scan clean
   - Documentation updated
   - Breaking changes documented

2. **Versioning**:
   - Follow semantic versioning (MAJOR.MINOR.PATCH)
   - Tag releases in Git
   - Maintain changelog

3. **Deployment**:
   - Test on multiple devices and browsers
   - Verify offline functionality
   - Check cross-platform compatibility
   - Monitor performance metrics

## Getting Help

- **Technical Questions**: Open a GitHub Discussion
- **Bug Reports**: Create a GitHub Issue
- **Feature Requests**: Start with a GitHub Discussion
- **Security Issues**: Email maintainers directly

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special recognition for paranormal investigation insights

---

Thank you for helping make OtherSide the most reliable and trustworthy paranormal investigation application available!