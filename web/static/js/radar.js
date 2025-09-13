// Radar Detection Module for Paranormal Presence Detection
class RadarDetector {
    constructor(app) {
        this.app = app;
        this.isActive = false;
        this.radarCanvas = document.getElementById('radarCanvas');
        this.radarContext = this.radarCanvas?.getContext('2d');
        this.toggleButton = document.getElementById('radarToggleBtn');
        
        // Radar settings
        this.centerX = this.radarCanvas ? this.radarCanvas.width / 2 : 125;
        this.centerY = this.radarCanvas ? this.radarCanvas.height / 2 : 125;
        this.maxRadius = Math.min(this.centerX, this.centerY) - 20;
        this.sweepAngle = 0;
        this.animationId = null;
        
        // Detection data
        this.detections = [];
        this.sweepSpeed = 2; // degrees per frame
        this.detectionThreshold = 0.3;
        
        // Sensor simulation
        this.emfLevel = 0;
        this.audioAnomalies = 0;
        this.detectionCount = 0;
        
        // UI elements
        this.emfReadingElement = document.getElementById('emfReading');
        this.audioAnomaliesElement = document.getElementById('audioAnomalies');
        this.detectionCountElement = document.getElementById('detectionCount');
        
        // Environmental sensor access
        this.deviceMotion = null;
        this.deviceOrientation = null;
        this.accelerometerData = { x: 0, y: 0, z: 0 };
        this.magnetometerData = { x: 0, y: 0, z: 0 };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDeviceSensors();
        
        // Initialize radar display
        if (this.radarContext) {
            this.drawRadarBase();
        }
        
        console.log('Radar detector initialized');
    }
    
    setupEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.isActive ? this.stopRadar() : this.startRadar();
            });
        }
    }
    
    async setupDeviceSensors() {
        try {
            // Request device motion permissions (iOS 13+)
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    this.enableDeviceMotion();
                }
            } else if ('DeviceMotionEvent' in window) {
                this.enableDeviceMotion();
            }
            
            // Request device orientation permissions (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.enableDeviceOrientation();
                }
            } else if ('DeviceOrientationEvent' in window) {
                this.enableDeviceOrientation();
            }
            
        } catch (error) {
            console.log('Device sensors not available:', error);
        }
    }
    
    enableDeviceMotion() {
        window.addEventListener('devicemotion', (event) => {
            this.accelerometerData = {
                x: event.accelerationIncludingGravity.x || 0,
                y: event.accelerationIncludingGravity.y || 0,
                z: event.accelerationIncludingGravity.z || 0
            };
            
            if (this.isActive) {
                this.processMotionData(event);
            }
        });
    }
    
    enableDeviceOrientation() {
        window.addEventListener('deviceorientation', (event) => {
            // Simulate magnetometer data from device orientation
            this.magnetometerData = {
                x: Math.sin((event.alpha || 0) * Math.PI / 180) * 100,
                y: Math.sin((event.beta || 0) * Math.PI / 180) * 100,
                z: Math.sin((event.gamma || 0) * Math.PI / 180) * 100
            };
            
            if (this.isActive) {
                this.processOrientationData(event);
            }
        });
    }
    
    startRadar() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.updateToggleButton();
        
        // Start radar sweep animation
        this.startSweep();
        
        // Start environmental monitoring
        this.startEnvironmentalMonitoring();
        
        // Add log entry
        this.app.addLogEntry('Radar detection activated', 'radar');
        
        console.log('Radar detection started');
    }
    
    stopRadar() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.updateToggleButton();
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear monitoring intervals
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // Clear radar display
        this.drawRadarBase();
        
        // Add log entry
        this.app.addLogEntry('Radar detection deactivated', 'radar');
        
        console.log('Radar detection stopped');
    }
    
    startSweep() {
        const animate = () => {
            if (!this.isActive) return;
            
            this.animationId = requestAnimationFrame(animate);
            
            // Update sweep angle
            this.sweepAngle += this.sweepSpeed;
            if (this.sweepAngle >= 360) {
                this.sweepAngle = 0;
                this.fadeDetections();
            }
            
            // Draw radar
            this.drawRadar();
            
            // Process detections at current angle
            this.processDetectionSweep();
        };
        
        animate();
    }
    
    startEnvironmentalMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.updateEnvironmentalReadings();
            this.detectAnomalies();
        }, 500); // Update every 500ms
    }
    
    drawRadarBase() {
        if (!this.radarContext) return;
        
        const ctx = this.radarContext;
        const canvas = this.radarCanvas;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw concentric circles
        ctx.strokeStyle = 'rgba(0, 184, 148, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, (this.maxRadius / 4) * i, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Draw cross lines
        ctx.beginPath();
        ctx.moveTo(this.centerX, 20);
        ctx.lineTo(this.centerX, canvas.height - 20);
        ctx.moveTo(20, this.centerY);
        ctx.lineTo(canvas.width - 20, this.centerY);
        ctx.stroke();
        
        // Draw center dot
        ctx.fillStyle = '#00b894';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    drawRadar() {
        this.drawRadarBase();
        
        if (!this.radarContext) return;
        
        const ctx = this.radarContext;
        
        // Draw sweep line
        const sweepRadians = this.sweepAngle * Math.PI / 180;
        const sweepEndX = this.centerX + Math.cos(sweepRadians - Math.PI / 2) * this.maxRadius;
        const sweepEndY = this.centerY + Math.sin(sweepRadians - Math.PI / 2) * this.maxRadius;
        
        // Sweep gradient
        const gradient = ctx.createLinearGradient(
            this.centerX, this.centerY,
            sweepEndX, sweepEndY
        );
        gradient.addColorStop(0, 'rgba(0, 184, 148, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 184, 148, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(sweepEndX, sweepEndY);
        ctx.stroke();
        
        // Draw detections
        this.drawDetections();
    }
    
    drawDetections() {
        if (!this.radarContext) return;
        
        const ctx = this.radarContext;
        
        this.detections.forEach(detection => {
            if (detection.alpha <= 0) return;
            
            // Calculate position
            const angle = detection.angle * Math.PI / 180;
            const x = this.centerX + Math.cos(angle - Math.PI / 2) * detection.distance;
            const y = this.centerY + Math.sin(angle - Math.PI / 2) * detection.distance;
            
            // Set color based on source type
            let color;
            switch (detection.sourceType) {
                case 'emf':
                    color = `rgba(232, 67, 147, ${detection.alpha})`;
                    break;
                case 'audio':
                    color = `rgba(116, 185, 255, ${detection.alpha})`;
                    break;
                case 'both':
                    color = `rgba(253, 121, 168, ${detection.alpha})`;
                    break;
                default:
                    color = `rgba(255, 255, 255, ${detection.alpha})`;
            }
            
            // Draw detection blob
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, detection.strength * 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw ripple effect for strong detections
            if (detection.strength > 0.7) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, detection.strength * 15, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    }
    
    processDetectionSweep() {
        // Simulate detection based on environmental factors and device sensors
        const detectionProbability = this.calculateDetectionProbability();
        
        if (Math.random() < detectionProbability) {
            this.createDetection();
        }
    }
    
    calculateDetectionProbability() {
        let probability = 0;
        
        // Base probability (very low for authenticity)
        probability += 0.001;
        
        // EMF factor (simulated from device motion)
        const motionMagnitude = Math.sqrt(
            this.accelerometerData.x ** 2 +
            this.accelerometerData.y ** 2 +
            this.accelerometerData.z ** 2
        );
        
        if (motionMagnitude > 15) { // Significant device movement
            probability += 0.002;
        }
        
        // Magnetometer factor (simulated from device orientation)
        const magneticMagnitude = Math.sqrt(
            this.magnetometerData.x ** 2 +
            this.magnetometerData.y ** 2 +
            this.magnetometerData.z ** 2
        );
        
        if (magneticMagnitude > 80) { // Magnetic anomaly
            probability += 0.003;
        }
        
        // Time-based factors (paranormal activity often reported at certain times)
        const hour = new Date().getHours();
        if (hour >= 0 && hour <= 4) { // Witching hours
            probability += 0.001;
        }
        
        // Environmental factors
        if (this.emfLevel > 50) {
            probability += this.emfLevel / 10000;
        }
        
        // Audio anomaly factor
        if (this.audioAnomalies > 2) {
            probability += 0.002;
        }
        
        return Math.min(probability, 0.01); // Cap at 1% per sweep
    }
    
    createDetection() {
        const detection = {
            angle: this.sweepAngle + (Math.random() - 0.5) * 30, // Some spread
            distance: Math.random() * this.maxRadius * 0.8 + this.maxRadius * 0.2,
            strength: Math.random() * 0.5 + 0.3,
            sourceType: this.determineSourceType(),
            alpha: 1.0,
            id: Date.now() + Math.random()
        };
        
        this.detections.push(detection);
        this.detectionCount++;
        
        // Limit detection array size
        if (this.detections.length > 50) {
            this.detections.shift();
        }
        
        // Update UI
        this.updateDetectionCount();
        
        // Send to server if online and has active session
        this.sendDetectionToServer(detection);
        
        // Add log entry for significant detections
        if (detection.strength > 0.6) {
            this.app.addLogEntry(
                `Strong radar detection at ${detection.angle.toFixed(0)}° (${detection.sourceType})`,
                'radar'
            );
        }
        
        console.log('Radar detection created:', detection);
    }
    
    determineSourceType() {
        const emfStrong = this.emfLevel > 40;
        const audioStrong = this.audioAnomalies > 1;
        
        if (emfStrong && audioStrong) {
            return 'both';
        } else if (emfStrong) {
            return 'emf';
        } else if (audioStrong) {
            return 'audio';
        } else {
            return Math.random() > 0.5 ? 'emf' : 'audio';
        }
    }
    
    fadeDetections() {
        this.detections = this.detections.filter(detection => {
            detection.alpha -= 0.05; // Fade rate
            return detection.alpha > 0;
        });
    }
    
    updateEnvironmentalReadings() {
        // Simulate EMF readings based on device sensors and random fluctuations
        const baseEMF = 10 + Math.random() * 20;
        const motionInfluence = Math.abs(this.accelerometerData.x + this.accelerometerData.y) / 10;
        const magneticInfluence = Math.abs(this.magnetometerData.x) / 50;
        
        this.emfLevel = Math.max(0, baseEMF + motionInfluence + magneticInfluence);
        
        // Simulate audio anomalies (would normally come from audio processing)
        if (Math.random() < 0.1) { // 10% chance per update
            this.audioAnomalies++;
            
            // Decay anomaly count over time
            setTimeout(() => {
                this.audioAnomalies = Math.max(0, this.audioAnomalies - 1);
                this.updateAudioAnomalies();
            }, 5000);
        }
        
        this.updateEMFReading();
        this.updateAudioAnomalies();
    }
    
    detectAnomalies() {
        // Check for significant environmental changes
        const previousEMF = this.previousEMF || this.emfLevel;
        const emfDelta = Math.abs(this.emfLevel - previousEMF);
        
        if (emfDelta > 20) {
            this.app.addLogEntry(`EMF spike detected: ${this.emfLevel.toFixed(1)} mG`, 'radar');
            
            // Create detection at random location
            if (this.isActive && Math.random() < 0.3) {
                this.createDetection();
            }
        }
        
        this.previousEMF = this.emfLevel;
    }
    
    processMotionData(event) {
        // Look for unusual motion patterns that might indicate paranormal activity
        const acceleration = event.accelerationIncludingGravity;
        const magnitude = Math.sqrt(
            acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
        );
        
        // Detect sudden changes or unusual patterns
        if (magnitude > 15 && Math.random() < 0.05) {
            this.app.addLogEntry('Unusual device motion detected', 'radar');
        }
    }
    
    processOrientationData(event) {
        // Look for compass anomalies that might indicate magnetic field disturbances
        const alpha = event.alpha || 0;
        const previousAlpha = this.previousAlpha || alpha;
        const alphaDelta = Math.abs(alpha - previousAlpha);
        
        if (alphaDelta > 30 && Math.random() < 0.03) {
            this.app.addLogEntry('Compass anomaly detected', 'radar');
        }
        
        this.previousAlpha = alpha;
    }
    
    async sendDetectionToServer(detection) {
        if (!this.app.activeSession || !this.app.isOnline) {
            return;
        }
        
        try {
            const radarData = {
                position: {
                    x: detection.distance * Math.cos(detection.angle * Math.PI / 180 - Math.PI / 2),
                    y: detection.distance * Math.sin(detection.angle * Math.PI / 180 - Math.PI / 2),
                    z: 0
                },
                strength: detection.strength,
                emf_reading: this.emfLevel,
                audio_anomaly: this.audioAnomalies,
                duration: 1.0, // Default duration
                movement_trail: [] // Could track movement over time
            };
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${this.app.activeSession.id}/radar`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(radarData)
                }
            );
            
            if (response.ok) {
                const result = await response.json();
                this.app.currentSessionData.radarEvents.push(result);
            }
            
        } catch (error) {
            console.error('Failed to send radar detection to server:', error);
        }
    }
    
    updateToggleButton() {
        if (this.toggleButton) {
            this.toggleButton.setAttribute('data-active', this.isActive.toString());
            const toggleText = this.toggleButton.querySelector('.toggle-text');
            if (toggleText) {
                toggleText.textContent = this.isActive ? 'Stop Radar' : 'Start Radar';
            }
        }
    }
    
    updateEMFReading() {
        if (this.emfReadingElement) {
            this.emfReadingElement.textContent = `${this.emfLevel.toFixed(1)} mG`;
        }
    }
    
    updateAudioAnomalies() {
        if (this.audioAnomaliesElement) {
            this.audioAnomaliesElement.textContent = this.audioAnomalies.toString();
        }
    }
    
    updateDetectionCount() {
        if (this.detectionCountElement) {
            this.detectionCountElement.textContent = this.detectionCount.toString();
        }
    }
    
    // Public methods for integration with other modules
    
    addAudioAnomaly() {
        this.audioAnomalies++;
        this.updateAudioAnomalies();
        
        // Trigger radar detection if active
        if (this.isActive && Math.random() < 0.2) {
            this.createDetection();
        }
    }
    
    setEMFLevel(level) {
        this.emfLevel = level;
        this.updateEMFReading();
    }
    
    getActiveDetections() {
        return this.detections.filter(d => d.alpha > 0.5);
    }
    
    reset() {
        this.detections = [];
        this.detectionCount = 0;
        this.audioAnomalies = 0;
        this.emfLevel = 0;
        
        this.updateEMFReading();
        this.updateAudioAnomalies();
        this.updateDetectionCount();
        
        if (this.radarContext) {
            this.drawRadarBase();
        }
    }
}

// Export for use in main app
if (typeof window !== 'undefined') {
    window.RadarDetector = RadarDetector;
}