# OtherSide Paranormal Investigation Application
# Makefile for building and running the application

.PHONY: build run test clean deps lint help

# Build configuration
BINARY_NAME=otherside-server
BUILD_DIR=bin
MAIN_PATH=./cmd/server
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)"

# Default target
all: deps lint test build

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

# Build the application
build:
	@echo "Building OtherSide server..."
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Run the application
run:
	@echo "Starting OtherSide server..."
	go run $(MAIN_PATH)

# Run on custom port
run-port:
	@echo "Starting OtherSide server on port $(PORT)..."
	PORT=$(PORT) go run $(MAIN_PATH)

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Lint code
lint:
	@echo "Running linters..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed, running basic checks..."; \
		go vet ./...; \
		go fmt ./...; \
	fi

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -f coverage.out coverage.html
	rm -rf data/otherside.db*
	rm -rf data/exports/*

# Set up development environment
dev-setup:
	@echo "Setting up development environment..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/air-verse/air@latest
	@echo "Development tools installed"

# Watch and reload during development
dev:
	@echo "Starting development server with hot reload..."
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "Air not installed, running normally..."; \
		$(MAKE) run; \
	fi

# Create data directories
init-dirs:
	@echo "Creating data directories..."
	mkdir -p data/sessions
	mkdir -p data/exports
	mkdir -p data/audio
	mkdir -p data/video
	chmod 755 data data/sessions data/exports data/audio data/video

# Database operations
db-reset:
	@echo "Resetting database..."
	rm -f data/otherside.db*
	@echo "Database reset complete"

db-backup:
	@echo "Backing up database..."
	@if [ -f data/otherside.db ]; then \
		cp data/otherside.db data/otherside-backup-$(shell date +%Y%m%d_%H%M%S).db; \
		echo "Database backed up"; \
	else \
		echo "No database found to backup"; \
	fi

# Docker operations (future)
docker-build:
	@echo "Building Docker image..."
	docker build -t otherside:$(VERSION) .

docker-run:
	@echo "Running in Docker..."
	docker run -p 8080:8080 -v $(PWD)/data:/app/data otherside:$(VERSION)

# Production deployment helpers
deploy-check:
	@echo "Running deployment checks..."
	$(MAKE) deps
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) build
	@echo "Deployment checks passed ✅"

# Generate API documentation (future)
docs:
	@echo "Generating API documentation..."
	@echo "API documentation generation not yet implemented"

# Performance benchmarks
bench:
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./...

# Security scan
security:
	@echo "Running security checks..."
	@if command -v gosec >/dev/null 2>&1; then \
		gosec ./...; \
	else \
		echo "gosec not installed, skipping security scan"; \
		echo "Install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"; \
	fi

# Help
help:
	@echo "OtherSide Paranormal Investigation Application"
	@echo ""
	@echo "Available targets:"
	@echo "  build         Build the application binary"
	@echo "  run           Run the application"
	@echo "  run-port      Run on custom port (use PORT=8081 make run-port)"
	@echo "  test          Run all tests"
	@echo "  test-coverage Run tests with coverage report"
	@echo "  lint          Run code linters"
	@echo "  clean         Clean build artifacts and data"
	@echo "  deps          Install/update dependencies"
	@echo "  dev-setup     Install development tools"
	@echo "  dev           Run with hot reload (requires air)"
	@echo "  init-dirs     Create required data directories"
	@echo "  db-reset      Reset database"
	@echo "  db-backup     Backup database"
	@echo "  deploy-check  Run all checks for deployment"
	@echo "  bench         Run performance benchmarks"
	@echo "  security      Run security scans"
	@echo "  help          Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make run                    # Start server on default port 8080"
	@echo "  PORT=3000 make run-port     # Start server on port 3000"
	@echo "  make test-coverage          # Run tests and generate coverage report"
	@echo "  make deploy-check           # Run all pre-deployment checks"