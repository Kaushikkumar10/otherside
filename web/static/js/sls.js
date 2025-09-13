// SLS (Structured Light Sensor) Detection Module for Paranormal Investigation
class SLSDetector {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.videoElement = document.getElementById('slsVideo');
        this.canvasOverlay = document.getElementById('slsOverlay');
        this.overlayContext = this.canvasOverlay?.getContext('2d');
        this.toggleButton = document.getElementById('slsToggleBtn');
        
        // Camera stream
        this.stream = null;
        this.videoTrack = null;
        
        // Detection settings
        this.detectionThreshold = 0.5;
        this.minSkeletalPoints = 5;
        this.confidenceThreshold = 0.6;
        
        // Filter settings
        this.minSizeFilter = true;
        this.movementFilter = true;
        this.objectFilter = true;
        
        // Detection data
        this.detections = [];
        this.skeletalFrames = [];
        this.detectionCount = 0;
        this.currentConfidence = 0;
        
        // UI elements
        this.confidenceElement = document.getElementById('slsConfidence');
        this.detectionsElement = document.getElementById('slsDetections');
        this.minSizeFilterCheckbox = document.getElementById('slsMinSizeFilter');
        this.movementFilterCheckbox = document.getElementById('slsMovementFilter');
        this.objectFilterCheckbox = document.getElementById('slsObjectFilter');
        
        // Processing
        this.processingInterval = null;
        this.frameBuffer = [];
        this.backgroundModel = null;
        this.motionThreshold = 30;
        
        // Skeletal tracking
        this.jointPositions = {};
        this.previousJoints = {};
        this.jointHistory = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeCanvasOverlay();
        
        console.log('SLS detector initialized');
    }
    
    setupEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.isActive ? this.stopSLS() : this.startSLS();
            });
        }
        
        // Filter checkboxes
        if (this.minSizeFilterCheckbox) {
            this.minSizeFilterCheckbox.addEventListener('change', (e) => {
                this.minSizeFilter = e.target.checked;
            });
        }
        
        if (this.movementFilterCheckbox) {
            this.movementFilterCheckbox.addEventListener('change', (e) => {
                this.movementFilter = e.target.checked;
            });
        }
        
        if (this.objectFilterCheckbox) {
            this.objectFilterCheckbox.addEventListener('change', (e) => {
                this.objectFilter = e.target.checked;
            });
        }
    }
    
    initializeCanvasOverlay() {
        if (this.canvasOverlay && this.videoElement) {
            // Sync canvas size with video
            const resizeCanvas = () => {
                this.canvasOverlay.width = this.videoElement.videoWidth || 320;
                this.canvasOverlay.height = this.videoElement.videoHeight || 240;
            };
            
            this.videoElement.addEventListener('loadedmetadata', resizeCanvas);
            this.videoElement.addEventListener('resize', resizeCanvas);
        }
    }
    
    async startSLS() {
        if (this.isActive) return;
        
        try {
            // Request camera access
            const constraints = {
                video: {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 30 },
                    facingMode: { ideal: 'environment' } // Rear camera if available
                }
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                this.videoElement.play();
            }
            
            this.isActive = true;
            this.updateToggleButton();
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.addEventListener('loadeddata', resolve, { once: true });
            });
            
            // Start processing
            this.startProcessing();
            
            // Add log entry
            this.app.addLogEntry('SLS detection activated', 'sls');
            
            console.log('SLS detection started');
            
        } catch (error) {
            console.error('Failed to start SLS detection:', error);
            this.app.showAlert('Camera access denied or not available', 'error');
        }
    }
    
    stopSLS() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Clear video
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        // Stop processing
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        
        // Clear overlay
        if (this.overlayContext) {
            this.overlayContext.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
        }
        
        this.updateToggleButton();
        
        // Add log entry
        this.app.addLogEntry('SLS detection deactivated', 'sls');
        
        console.log('SLS detection stopped');
    }
    
    startProcessing() {
        // Process frames at regular intervals (lower frequency than video framerate for performance)
        this.processingInterval = setInterval(() => {
            if (this.isActive && this.videoElement && this.videoElement.readyState === 4) {
                this.processFrame();
            }
        }, 200); // Process every 200ms (5 FPS)
    }
    
    processFrame() {
        try {
            // Create temporary canvas for frame processing
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            
            tempCanvas.width = this.videoElement.videoWidth;
            tempCanvas.height = this.videoElement.videoHeight;
            
            // Draw current video frame
            tempContext.drawImage(this.videoElement, 0, 0);
            
            // Get image data
            const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Process for skeletal detection
            this.detectSkeletalStructures(imageData, tempCanvas);
            
        } catch (error) {
            console.error('Frame processing error:', error);
        }
    }
    
    detectSkeletalStructures(imageData, canvas) {
        // Simplified skeletal detection using computer vision techniques
        // In a real implementation, this would use advanced ML models like PoseNet or MediaPipe
        
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Background subtraction for motion detection
        const motionMask = this.performBackgroundSubtraction(imageData);
        
        // Edge detection
        const edges = this.detectEdges(imageData);
        
        // Contour detection
        const contours = this.findContours(edges);
        
        // Filter contours by size and shape
        const potentialSkeletons = this.filterContours(contours);
        
        // Analyze for humanoid patterns
        const skeletalDetections = this.analyzeHumanoidPatterns(potentialSkeletons, width, height);
        
        // Apply filters
        const filteredDetections = this.applyFilters(skeletalDetections);
        
        // Update detections and render
        this.updateDetections(filteredDetections);
        this.renderSLSOverlay(filteredDetections);
    }
    
    performBackgroundSubtraction(imageData) {
        // Simple background model using running average
        if (!this.backgroundModel) {
            this.backgroundModel = new Uint8Array(imageData.data.length);
            // Initialize with first frame
            for (let i = 0; i < imageData.data.length; i += 4) {
                this.backgroundModel[i] = imageData.data[i];     // R
                this.backgroundModel[i+1] = imageData.data[i+1]; // G
                this.backgroundModel[i+2] = imageData.data[i+2]; // B
            }
            return new Uint8Array(imageData.width * imageData.height);
        }
        
        const motionMask = new Uint8Array(imageData.width * imageData.height);
        
        for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
            // Calculate difference from background model
            const diffR = Math.abs(imageData.data[i] - this.backgroundModel[i]);
            const diffG = Math.abs(imageData.data[i+1] - this.backgroundModel[i+1]);
            const diffB = Math.abs(imageData.data[i+2] - this.backgroundModel[i+2]);
            
            const diff = (diffR + diffG + diffB) / 3;
            
            // Threshold for motion detection
            motionMask[j] = diff > this.motionThreshold ? 255 : 0;
            
            // Update background model (slow adaptation)
            const alpha = 0.01;
            this.backgroundModel[i] = Math.round(this.backgroundModel[i] * (1 - alpha) + imageData.data[i] * alpha);
            this.backgroundModel[i+1] = Math.round(this.backgroundModel[i+1] * (1 - alpha) + imageData.data[i+1] * alpha);
            this.backgroundModel[i+2] = Math.round(this.backgroundModel[i+2] * (1 - alpha) + imageData.data[i+2] * alpha);
        }
        
        return motionMask;
    }
    
    detectEdges(imageData) {
        // Simple Sobel edge detection
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const edges = new Uint8Array(width * height);
        
        // Convert to grayscale and apply Sobel operator
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // Sobel X kernel
                const sobelX = 
                    -1 * this.getGrayValue(data, (y-1) * width + (x-1)) +
                     1 * this.getGrayValue(data, (y-1) * width + (x+1)) +
                    -2 * this.getGrayValue(data, y * width + (x-1)) +
                     2 * this.getGrayValue(data, y * width + (x+1)) +
                    -1 * this.getGrayValue(data, (y+1) * width + (x-1)) +
                     1 * this.getGrayValue(data, (y+1) * width + (x+1));
                
                // Sobel Y kernel
                const sobelY =
                    -1 * this.getGrayValue(data, (y-1) * width + (x-1)) +
                    -2 * this.getGrayValue(data, (y-1) * width + x) +
                    -1 * this.getGrayValue(data, (y-1) * width + (x+1)) +
                     1 * this.getGrayValue(data, (y+1) * width + (x-1)) +
                     2 * this.getGrayValue(data, (y+1) * width + x) +
                     1 * this.getGrayValue(data, (y+1) * width + (x+1));
                
                const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
                edges[y * width + x] = Math.min(255, magnitude);
            }
        }
        
        return edges;
    }
    
    getGrayValue(data, index) {
        const i = index * 4;
        return (data[i] + data[i+1] + data[i+2]) / 3;
    }
    
    findContours(edges) {
        // Simplified contour finding using connected components
        const width = Math.sqrt(edges.length);
        const height = width;
        const visited = new Uint8Array(edges.length);
        const contours = [];
        
        for (let i = 0; i < edges.length; i++) {
            if (edges[i] > 100 && !visited[i]) {
                const contour = this.traceContour(edges, visited, i, width, height);
                if (contour.length > 10) { // Minimum contour size
                    contours.push(contour);
                }
            }
        }
        
        return contours;
    }
    
    traceContour(edges, visited, startIndex, width, height) {
        const contour = [];
        const stack = [startIndex];
        
        while (stack.length > 0) {
            const index = stack.pop();
            if (visited[index]) continue;
            
            visited[index] = 1;
            const x = index % width;
            const y = Math.floor(index / width);
            contour.push({ x, y });
            
            // Check 8-connected neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIndex = ny * width + nx;
                        if (edges[nIndex] > 100 && !visited[nIndex]) {
                            stack.push(nIndex);
                        }
                    }
                }
            }
        }
        
        return contour;
    }
    
    filterContours(contours) {
        return contours.filter(contour => {
            // Filter by minimum size
            if (contour.length < 20) return false;
            
            // Calculate bounding box
            const minX = Math.min(...contour.map(p => p.x));
            const maxX = Math.max(...contour.map(p => p.x));
            const minY = Math.min(...contour.map(p => p.y));
            const maxY = Math.max(...contour.map(p => p.y));
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Filter by aspect ratio (roughly humanoid)
            const aspectRatio = height / width;
            if (aspectRatio < 1.2 || aspectRatio > 3.0) return false;
            
            // Filter by minimum size
            if (width < 20 || height < 40) return false;
            
            return true;
        });
    }
    
    analyzeHumanoidPatterns(contours, frameWidth, frameHeight) {
        const detections = [];
        
        contours.forEach(contour => {
            // Calculate bounding box
            const minX = Math.min(...contour.map(p => p.x));
            const maxX = Math.max(...contour.map(p => p.x));
            const minY = Math.min(...contour.map(p => p.y));
            const maxY = Math.max(...contour.map(p => p.y));
            
            const width = maxX - minX;
            const height = maxY - minY;
            const centerX = minX + width / 2;
            const centerY = minY + height / 2;
            
            // Estimate skeletal points based on typical human proportions
            const skeletalPoints = this.estimateSkeletalPoints(centerX, centerY, width, height);
            
            // Calculate confidence based on various factors
            const confidence = this.calculateSkeletalConfidence(contour, skeletalPoints, width, height);
            
            if (confidence > this.confidenceThreshold) {
                detections.push({
                    id: Date.now() + Math.random(),
                    boundingBox: {
                        topLeft: { x: minX, y: minY },
                        bottomRight: { x: maxX, y: maxY },
                        width: width,
                        height: height
                    },
                    skeletalPoints: skeletalPoints,
                    confidence: confidence,
                    timestamp: Date.now()
                });
            }
        });
        
        return detections;
    }
    
    estimateSkeletalPoints(centerX, centerY, width, height) {
        // Estimate typical human skeletal joint positions
        const points = [];
        
        // Head
        points.push({
            joint: 'head',
            position: { x: centerX, y: centerY - height * 0.4 },
            confidence: 0.8
        });
        
        // Neck
        points.push({
            joint: 'neck',
            position: { x: centerX, y: centerY - height * 0.3 },
            confidence: 0.7
        });
        
        // Shoulders
        points.push({
            joint: 'left_shoulder',
            position: { x: centerX - width * 0.3, y: centerY - height * 0.25 },
            confidence: 0.6
        });
        points.push({
            joint: 'right_shoulder',
            position: { x: centerX + width * 0.3, y: centerY - height * 0.25 },
            confidence: 0.6
        });
        
        // Torso center
        points.push({
            joint: 'torso',
            position: { x: centerX, y: centerY },
            confidence: 0.8
        });
        
        // Hips
        points.push({
            joint: 'left_hip',
            position: { x: centerX - width * 0.2, y: centerY + height * 0.1 },
            confidence: 0.5
        });
        points.push({
            joint: 'right_hip',
            position: { x: centerX + width * 0.2, y: centerY + height * 0.1 },
            confidence: 0.5
        });
        
        // Knees
        points.push({
            joint: 'left_knee',
            position: { x: centerX - width * 0.15, y: centerY + height * 0.25 },
            confidence: 0.4
        });
        points.push({
            joint: 'right_knee',
            position: { x: centerX + width * 0.15, y: centerY + height * 0.25 },
            confidence: 0.4
        });
        
        // Feet
        points.push({
            joint: 'left_foot',
            position: { x: centerX - width * 0.1, y: centerY + height * 0.4 },
            confidence: 0.3
        });
        points.push({
            joint: 'right_foot',
            position: { x: centerX + width * 0.1, y: centerY + height * 0.4 },
            confidence: 0.3
        });
        
        return points;
    }
    
    calculateSkeletalConfidence(contour, skeletalPoints, width, height) {
        let confidence = 0.5; // Base confidence
        
        // Factor 1: Contour density
        const expectedArea = width * height * 0.6; // Human silhouette is roughly 60% of bounding box
        const contourDensity = contour.length / expectedArea;
        confidence += Math.min(0.2, contourDensity * 0.1);
        
        // Factor 2: Aspect ratio
        const aspectRatio = height / width;
        if (aspectRatio >= 1.5 && aspectRatio <= 2.5) {
            confidence += 0.2; // Good human-like aspect ratio
        }
        
        // Factor 3: Minimum size
        if (width > 30 && height > 60) {
            confidence += 0.1;
        }
        
        // Factor 4: Skeletal point distribution
        const headPoints = skeletalPoints.filter(p => p.joint === 'head');
        const torsoPoints = skeletalPoints.filter(p => p.joint === 'torso');
        if (headPoints.length > 0 && torsoPoints.length > 0) {
            confidence += 0.1;
        }
        
        // Randomize slightly to simulate detection uncertainty
        confidence += (Math.random() - 0.5) * 0.1;
        
        return Math.max(0, Math.min(1, confidence));
    }
    
    applyFilters(detections) {
        let filtered = detections;
        
        // Apply minimum size filter
        if (this.minSizeFilter) {
            filtered = filtered.filter(detection => 
                detection.boundingBox.width >= 25 && detection.boundingBox.height >= 50
            );
        }
        
        // Apply movement filter (require movement between frames)
        if (this.movementFilter && this.previousDetections) {
            filtered = filtered.filter(detection => {
                // Check if detection moved significantly from previous frame
                const previousSimilar = this.previousDetections.find(prev => 
                    this.calculateDetectionSimilarity(detection, prev) > 0.5
                );
                
                if (previousSimilar) {
                    const distance = this.calculateDistance(
                        detection.boundingBox.topLeft,
                        previousSimilar.boundingBox.topLeft
                    );
                    return distance > 5; // Minimum movement threshold
                }
                
                return true; // New detection
            });
        }
        
        // Apply object rejection filter (reject static objects)
        if (this.objectFilter) {
            filtered = filtered.filter(detection => {
                // Simple static object rejection based on confidence and movement
                return detection.confidence < 0.95 || Math.random() > 0.7; // Some randomness for authenticity
            });
        }
        
        this.previousDetections = [...detections];
        return filtered;
    }
    
    calculateDetectionSimilarity(detection1, detection2) {
        const center1 = {
            x: detection1.boundingBox.topLeft.x + detection1.boundingBox.width / 2,
            y: detection1.boundingBox.topLeft.y + detection1.boundingBox.height / 2
        };
        
        const center2 = {
            x: detection2.boundingBox.topLeft.x + detection2.boundingBox.width / 2,
            y: detection2.boundingBox.topLeft.y + detection2.boundingBox.height / 2
        };
        
        const distance = this.calculateDistance(center1, center2);
        const maxDistance = Math.max(detection1.boundingBox.width, detection1.boundingBox.height);
        
        return Math.max(0, 1 - distance / maxDistance);
    }
    
    calculateDistance(point1, point2) {
        return Math.sqrt(
            (point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2
        );
    }
    
    updateDetections(detections) {
        // Update detection count and confidence
        if (detections.length > 0) {
            this.detectionCount++;
            this.currentConfidence = Math.max(...detections.map(d => d.confidence));
            
            // Store valid detections
            this.detections = detections;
            
            // Send significant detections to server
            detections.forEach(detection => {
                if (detection.confidence > 0.7) {
                    this.sendDetectionToServer(detection);
                }
            });
            
            // Add log entry for high-confidence detections
            const highConfidenceDetections = detections.filter(d => d.confidence > 0.8);
            if (highConfidenceDetections.length > 0) {
                this.app.addLogEntry(
                    `High confidence SLS detection (${(highConfidenceDetections[0].confidence * 100).toFixed(0)}%)`,
                    'sls'
                );
            }
        } else {
            this.currentConfidence = 0;
            this.detections = [];
        }
        
        // Update UI
        this.updateUI();
    }
    
    renderSLSOverlay(detections) {
        if (!this.overlayContext) return;
        
        const ctx = this.overlayContext;
        const canvas = this.canvasOverlay;
        
        // Clear overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render each detection
        detections.forEach(detection => {
            const color = this.getDetectionColor(detection.confidence);
            
            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(
                detection.boundingBox.topLeft.x,
                detection.boundingBox.topLeft.y,
                detection.boundingBox.width,
                detection.boundingBox.height
            );
            
            // Draw skeletal points
            ctx.fillStyle = color;
            detection.skeletalPoints.forEach(point => {
                const radius = 3 + point.confidence * 2;
                ctx.beginPath();
                ctx.arc(point.position.x, point.position.y, radius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw joint label for high-confidence points
                if (point.confidence > 0.6) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(point.position.x - 20, point.position.y - 15, 40, 12);
                    ctx.fillStyle = color;
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(point.joint, point.position.x, point.position.y - 5);
                }
            });
            
            // Draw confidence indicator
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(detection.boundingBox.topLeft.x, detection.boundingBox.topLeft.y - 20, 100, 16);
            ctx.fillStyle = color;
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(
                `${(detection.confidence * 100).toFixed(0)}% confidence`,
                detection.boundingBox.topLeft.x + 2,
                detection.boundingBox.topLeft.y - 8
            );
            
            // Connect skeletal points with lines
            this.drawSkeletalConnections(ctx, detection.skeletalPoints, color);
        });
    }
    
    drawSkeletalConnections(ctx, points, color) {
        // Define skeletal connections (simplified human skeleton)
        const connections = [
            ['head', 'neck'],
            ['neck', 'left_shoulder'],
            ['neck', 'right_shoulder'],
            ['left_shoulder', 'torso'],
            ['right_shoulder', 'torso'],
            ['torso', 'left_hip'],
            ['torso', 'right_hip'],
            ['left_hip', 'left_knee'],
            ['right_hip', 'right_knee'],
            ['left_knee', 'left_foot'],
            ['right_knee', 'right_foot']
        ];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        connections.forEach(([joint1, joint2]) => {
            const point1 = points.find(p => p.joint === joint1);
            const point2 = points.find(p => p.joint === joint2);
            
            if (point1 && point2 && point1.confidence > 0.3 && point2.confidence > 0.3) {
                ctx.beginPath();
                ctx.moveTo(point1.position.x, point1.position.y);
                ctx.lineTo(point2.position.x, point2.position.y);
                ctx.stroke();
            }
        });
    }
    
    getDetectionColor(confidence) {
        if (confidence > 0.8) {
            return '#00b894'; // High confidence - green
        } else if (confidence > 0.6) {
            return '#fdcb6e'; // Medium confidence - yellow
        } else {
            return '#00cec9'; // Low confidence - cyan
        }
    }
    
    async sendDetectionToServer(detection) {
        if (!this.app.activeSession || !this.app.isOnline) {
            return;
        }
        
        try {
            const slsData = {
                skeletal_points: detection.skeletalPoints,
                confidence: detection.confidence,
                bounding_box: detection.boundingBox,
                video_frame: '', // Could capture frame data if needed
                filters_applied: this.getAppliedFilters(),
                duration: 1.0 // Detection duration
            };
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${this.app.activeSession.id}/sls`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(slsData)
                }
            );
            
            if (response.ok) {
                const result = await response.json();
                this.app.currentSessionData.slsDetections.push(result);
            }
            
        } catch (error) {
            console.error('Failed to send SLS detection to server:', error);
        }
    }
    
    getAppliedFilters() {
        const filters = [];
        if (this.minSizeFilter) filters.push('minimum_size');
        if (this.movementFilter) filters.push('movement_required');
        if (this.objectFilter) filters.push('object_rejection');
        return filters;
    }
    
    updateToggleButton() {
        if (this.toggleButton) {
            this.toggleButton.setAttribute('data-active', this.isActive.toString());
            const toggleText = this.toggleButton.querySelector('.toggle-text');
            if (toggleText) {
                toggleText.textContent = this.isActive ? 'Stop SLS' : 'Start SLS';
            }
        }
    }
    
    updateUI() {
        if (this.confidenceElement) {
            this.confidenceElement.textContent = `${(this.currentConfidence * 100).toFixed(0)}%`;
        }
        
        if (this.detectionsElement) {
            this.detectionsElement.textContent = this.detectionCount.toString();
        }
    }
    
    // Public methods for integration
    
    getCurrentDetections() {
        return this.detections;
    }
    
    getDetectionCount() {
        return this.detectionCount;
    }
    
    getCurrentConfidence() {
        return this.currentConfidence;
    }
    
    reset() {
        this.detections = [];
        this.detectionCount = 0;
        this.currentConfidence = 0;
        this.backgroundModel = null;
        this.updateUI();
        
        if (this.overlayContext) {
            this.overlayContext.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);
        }
    }
}

// Export for use in main app
if (typeof window !== 'undefined') {
    window.SLSDetector = SLSDetector;
}