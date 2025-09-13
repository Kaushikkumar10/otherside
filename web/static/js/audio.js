// Audio Processing Module for EVP Recording and Analysis
class AudioProcessor {
    constructor(app) {
        this.app = app;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.audioChunks = [];
        this.recordingStartTime = null;
        this.animationId = null;
        
        // Audio processing settings
        this.sampleRate = 44100;
        this.fftSize = 1024;
        this.noiseThreshold = 0.1;
        
        // Recording controls
        this.recordButton = document.getElementById('evpRecordBtn');
        this.playButton = document.getElementById('evpPlayBtn');
        this.slowButton = document.getElementById('evpSlowBtn');
        this.reverseButton = document.getElementById('evpReverseBtn');
        this.clearButton = document.getElementById('evpClearBtn');
        
        // Visualization elements
        this.waveformCanvas = document.getElementById('evpWaveform');
        this.waveformContext = this.waveformCanvas?.getContext('2d');
        this.audioLevelElement = document.getElementById('audioLevel');
        this.durationElement = document.getElementById('recordingDuration');
        this.analysisElement = document.getElementById('evpAnalysis');
        
        // Playback
        this.currentAudio = null;
        this.playbackRate = 1.0;
        this.isReversed = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            console.log('Audio processor initialized');
            
        } catch (error) {
            console.error('Failed to initialize audio processor:', error);
            this.app.showAlert('Audio initialization failed. Microphone access may be restricted.', 'error');
        }
    }
    
    setupEventListeners() {
        if (this.recordButton) {
            this.recordButton.addEventListener('click', () => {
                this.isRecording ? this.stopRecording() : this.startRecording();
            });
        }
        
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.playRecording());
        }
        
        if (this.slowButton) {
            this.slowButton.addEventListener('click', () => this.toggleSlowPlayback());
        }
        
        if (this.reverseButton) {
            this.reverseButton.addEventListener('click', () => this.toggleReversePlayback());
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.clearRecording());
        }
    }
    
    async startRecording() {
        if (this.isRecording) return;
        
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: this.sampleRate,
                    channelCount: 1,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            // Setup audio analysis
            this.setupAudioAnalysis(stream);
            
            // Reset audio chunks
            this.audioChunks = [];
            
            // Media recorder event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Update UI
            this.updateRecordingUI(true);
            
            // Start visualization
            this.startVisualization();
            
            // Add log entry
            this.app.addLogEntry('EVP recording started', 'evp');
            
            console.log('EVP recording started');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.app.showAlert('Failed to access microphone. Please check permissions.', 'error');
        }
    }
    
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop microphone stream
            if (this.microphone && this.microphone.mediaStream) {
                this.microphone.mediaStream.getTracks().forEach(track => track.stop());
            }
            
            // Update UI
            this.updateRecordingUI(false);
            
            // Stop visualization
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            console.log('EVP recording stopped');
            
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.app.showAlert('Error stopping recording', 'error');
        }
    }
    
    setupAudioAnalysis(stream) {
        try {
            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = 0.3;
            
            this.microphone.connect(this.analyser);
            
            // Create data array for frequency analysis
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
        } catch (error) {
            console.error('Failed to setup audio analysis:', error);
        }
    }
    
    startVisualization() {
        if (!this.analyser || !this.waveformContext) return;
        
        const draw = () => {
            if (!this.isRecording) return;
            
            this.animationId = requestAnimationFrame(draw);
            
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate audio level
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            const average = sum / this.dataArray.length;
            const audioLevel = ((average / 255) * 100).toFixed(1);
            
            // Update audio level display
            if (this.audioLevelElement) {
                this.audioLevelElement.textContent = audioLevel;
            }
            
            // Update duration
            if (this.durationElement && this.recordingStartTime) {
                const duration = (Date.now() - this.recordingStartTime) / 1000;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                this.durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Draw waveform
            this.drawWaveform();
            
            // Check for potential EVP activity
            this.detectPotentialEVP(average);
        };
        
        draw();
    }
    
    drawWaveform() {
        if (!this.waveformContext || !this.dataArray) return;
        
        const canvas = this.waveformCanvas;
        const ctx = this.waveformContext;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set up drawing
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00cec9'; // EVP active color
        ctx.beginPath();
        
        const sliceWidth = canvas.width / this.dataArray.length;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 255.0;
            const y = v * canvas.height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        
        // Draw frequency bars for paranormal frequency ranges
        this.drawFrequencyBars();
    }
    
    drawFrequencyBars() {
        if (!this.waveformContext || !this.dataArray) return;
        
        const ctx = this.waveformContext;
        const canvas = this.waveformCanvas;
        
        // Focus on human voice frequency range (85-255 Hz fundamental, harmonics up to 2kHz)
        const voiceStart = Math.floor((85 / (this.sampleRate / 2)) * this.dataArray.length);
        const voiceEnd = Math.floor((2000 / (this.sampleRate / 2)) * this.dataArray.length);
        
        // Highlight voice frequency range
        ctx.fillStyle = 'rgba(108, 92, 231, 0.3)';
        const barWidth = canvas.width / this.dataArray.length;
        
        for (let i = voiceStart; i < Math.min(voiceEnd, this.dataArray.length); i++) {
            const barHeight = (this.dataArray[i] / 255.0) * canvas.height;
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
        }
    }
    
    detectPotentialEVP(audioLevel) {
        // Simple EVP detection based on audio level patterns
        // This is a placeholder - real EVP detection would be much more sophisticated
        
        const threshold = 30; // Minimum level for potential EVP
        const voiceFrequencyActivity = this.analyzeVoiceFrequencies();
        
        if (audioLevel > threshold && voiceFrequencyActivity > 0.3) {
            // Potential EVP activity detected
            this.highlightPotentialEVP();
        }
    }
    
    analyzeVoiceFrequencies() {
        if (!this.dataArray) return 0;
        
        // Analyze voice frequency range
        const voiceStart = Math.floor((85 / (this.sampleRate / 2)) * this.dataArray.length);
        const voiceEnd = Math.floor((2000 / (this.sampleRate / 2)) * this.dataArray.length);
        
        let voiceSum = 0;
        let totalSum = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            totalSum += this.dataArray[i];
            if (i >= voiceStart && i < voiceEnd) {
                voiceSum += this.dataArray[i];
            }
        }
        
        return totalSum > 0 ? voiceSum / totalSum : 0;
    }
    
    highlightPotentialEVP() {
        // Visual indication of potential EVP activity
        if (this.waveformCanvas) {
            this.waveformCanvas.style.borderColor = '#e84393';
            setTimeout(() => {
                this.waveformCanvas.style.borderColor = '#444444';
            }, 200);
        }
    }
    
    async processRecording() {
        if (this.audioChunks.length === 0) return;
        
        try {
            // Create blob from recorded chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Convert to audio buffer for analysis
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Store for playback
            this.currentAudio = audioBuffer;
            
            // Enable playback controls
            this.updatePlaybackControls(true);
            
            // Analyze recording
            await this.analyzeRecording(audioBuffer);
            
            // Send to server for processing
            await this.sendForServerAnalysis(audioBlob);
            
            // Add log entry
            const duration = audioBuffer.duration.toFixed(2);
            this.app.addLogEntry(`EVP recording completed (${duration}s)`, 'evp');
            
        } catch (error) {
            console.error('Failed to process recording:', error);
            this.app.showAlert('Error processing recording', 'error');
        }
    }
    
    async analyzeRecording(audioBuffer) {
        try {
            // Basic client-side analysis
            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            
            // Calculate RMS (Root Mean Square) for overall loudness
            let rms = 0;
            for (let i = 0; i < channelData.length; i++) {
                rms += channelData[i] * channelData[i];
            }
            rms = Math.sqrt(rms / channelData.length);
            
            // Calculate zero crossing rate (indicator of voice-like content)
            let crossings = 0;
            for (let i = 1; i < channelData.length; i++) {
                if ((channelData[i] >= 0) !== (channelData[i-1] >= 0)) {
                    crossings++;
                }
            }
            const zcr = crossings / channelData.length;
            
            // Basic spectral analysis
            const spectralAnalysis = await this.performSpectralAnalysis(channelData, sampleRate);
            
            // Display analysis results
            this.displayAnalysisResults({
                duration: audioBuffer.duration,
                rms: rms,
                zeroCrossingRate: zcr,
                spectralAnalysis: spectralAnalysis
            });
            
        } catch (error) {
            console.error('Failed to analyze recording:', error);
        }
    }
    
    async performSpectralAnalysis(channelData, sampleRate) {
        // Simple FFT-based spectral analysis
        const fftSize = 1024;
        const results = {
            dominantFrequency: 0,
            voiceRangeEnergy: 0,
            totalEnergy: 0
        };
        
        try {
            // Create offline audio context for analysis
            const offlineContext = new OfflineAudioContext(1, channelData.length, sampleRate);
            const buffer = offlineContext.createBuffer(1, channelData.length, sampleRate);
            buffer.copyToChannel(channelData, 0);
            
            const source = offlineContext.createBufferSource();
            const analyser = offlineContext.createAnalyser();
            
            source.buffer = buffer;
            analyser.fftSize = fftSize;
            
            source.connect(analyser);
            analyser.connect(offlineContext.destination);
            
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(frequencyData);
            
            // Find dominant frequency
            let maxIndex = 0;
            let maxValue = 0;
            let totalEnergy = 0;
            let voiceEnergy = 0;
            
            for (let i = 0; i < frequencyData.length; i++) {
                const value = frequencyData[i];
                totalEnergy += value;
                
                if (value > maxValue) {
                    maxValue = value;
                    maxIndex = i;
                }
                
                // Check if in voice range (85-2000 Hz)
                const frequency = (i / frequencyData.length) * (sampleRate / 2);
                if (frequency >= 85 && frequency <= 2000) {
                    voiceEnergy += value;
                }
            }
            
            results.dominantFrequency = (maxIndex / frequencyData.length) * (sampleRate / 2);
            results.voiceRangeEnergy = voiceEnergy;
            results.totalEnergy = totalEnergy;
            
        } catch (error) {
            console.error('Spectral analysis failed:', error);
        }
        
        return results;
    }
    
    displayAnalysisResults(analysis) {
        if (!this.analysisElement) return;
        
        const voiceRangePercentage = analysis.spectralAnalysis.totalEnergy > 0 
            ? (analysis.spectralAnalysis.voiceRangeEnergy / analysis.spectralAnalysis.totalEnergy * 100).toFixed(1)
            : 0;
            
        const quality = this.determineEVPQuality(analysis);
        
        this.analysisElement.innerHTML = `
            <div class="analysis-header">
                <h4>EVP Analysis Results</h4>
                <span class="quality-badge quality-${quality.level}">${quality.level.toUpperCase()}</span>
            </div>
            <div class="analysis-metrics">
                <div class="metric">
                    <span class="metric-label">Duration:</span>
                    <span class="metric-value">${analysis.duration.toFixed(2)}s</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Audio Level:</span>
                    <span class="metric-value">${(analysis.rms * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Voice Range Activity:</span>
                    <span class="metric-value">${voiceRangePercentage}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Dominant Frequency:</span>
                    <span class="metric-value">${analysis.spectralAnalysis.dominantFrequency.toFixed(1)} Hz</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Zero Crossing Rate:</span>
                    <span class="metric-value">${(analysis.zeroCrossingRate * 1000).toFixed(2)}</span>
                </div>
            </div>
            <div class="analysis-interpretation">
                <h5>Interpretation:</h5>
                <p>${quality.description}</p>
                ${quality.level !== 'poor' ? '<p class="evp-recommendation">⚠️ Consider further analysis and review for potential paranormal content.</p>' : ''}
            </div>
        `;
    }
    
    determineEVPQuality(analysis) {
        const voicePercentage = analysis.spectralAnalysis.totalEnergy > 0 
            ? (analysis.spectralAnalysis.voiceRangeEnergy / analysis.spectralAnalysis.totalEnergy)
            : 0;
        
        const dominantFreq = analysis.spectralAnalysis.dominantFrequency;
        const isInVoiceRange = dominantFreq >= 85 && dominantFreq <= 2000;
        const audioLevel = analysis.rms;
        
        if (audioLevel > 0.1 && voicePercentage > 0.6 && isInVoiceRange) {
            return {
                level: 'excellent',
                description: 'Strong audio signal with significant activity in human voice frequency range. High potential for EVP content.'
            };
        } else if (audioLevel > 0.05 && voicePercentage > 0.4 && isInVoiceRange) {
            return {
                level: 'good',
                description: 'Moderate audio signal with notable voice-range activity. Potential EVP content detected.'
            };
        } else if (audioLevel > 0.02 && voicePercentage > 0.2) {
            return {
                level: 'fair',
                description: 'Weak but detectable audio signal. Some activity in voice frequencies. Requires careful review.'
            };
        } else {
            return {
                level: 'poor',
                description: 'Low audio signal or minimal voice-range activity. Unlikely to contain EVP content.'
            };
        }
    }
    
    async sendForServerAnalysis(audioBlob) {
        if (!this.app.activeSession || !this.app.isOnline) {
            console.log('Skipping server analysis - offline or no active session');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'evp-recording.webm');
            formData.append('annotations', JSON.stringify([]));
            
            const response = await fetch(`${this.app.apiBaseUrl}/sessions/${this.app.activeSession.id}/evp`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Server EVP analysis:', result);
                
                // Add to current session data
                this.app.currentSessionData.evps.push(result);
                
                this.app.showAlert('EVP recording processed and saved', 'success');
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
            
        } catch (error) {
            console.error('Failed to send recording for server analysis:', error);
            
            // Store locally for later sync
            const offlineData = JSON.parse(localStorage.getItem('otherside_offline_data') || '[]');
            offlineData.push({
                type: 'evp',
                sessionId: this.app.activeSession.id,
                data: audioBlob,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('otherside_offline_data', JSON.stringify(offlineData));
            
            this.app.showAlert('Recording saved locally. Will sync when online.', 'warning');
        }
    }
    
    playRecording() {
        if (!this.currentAudio || !this.audioContext) return;
        
        try {
            // Stop any current playback
            if (this.playbackSource) {
                this.playbackSource.stop();
            }
            
            // Create buffer source
            this.playbackSource = this.audioContext.createBufferSource();
            this.playbackSource.buffer = this.currentAudio;
            
            // Apply playback rate and reverse if needed
            this.playbackSource.playbackRate.value = this.playbackRate;
            
            // If reversed, we need to reverse the audio buffer
            let bufferToPlay = this.currentAudio;
            if (this.isReversed) {
                bufferToPlay = this.reverseAudioBuffer(this.currentAudio);
                this.playbackSource.buffer = bufferToPlay;
            }
            
            // Connect and play
            this.playbackSource.connect(this.audioContext.destination);
            this.playbackSource.start();
            
            // Update UI
            if (this.playButton) {
                this.playButton.textContent = 'Playing...';
                this.playButton.disabled = true;
            }
            
            // Re-enable button after playback
            this.playbackSource.onended = () => {
                if (this.playButton) {
                    this.playButton.textContent = 'Play';
                    this.playButton.disabled = false;
                }
            };
            
        } catch (error) {
            console.error('Failed to play recording:', error);
            this.app.showAlert('Playback failed', 'error');
        }
    }
    
    toggleSlowPlayback() {
        this.playbackRate = this.playbackRate === 1.0 ? 0.5 : 1.0;
        
        if (this.slowButton) {
            this.slowButton.textContent = this.playbackRate === 0.5 ? 'Normal Speed' : 'Slow';
            this.slowButton.classList.toggle('active', this.playbackRate === 0.5);
        }
    }
    
    toggleReversePlayback() {
        this.isReversed = !this.isReversed;
        
        if (this.reverseButton) {
            this.reverseButton.textContent = this.isReversed ? 'Forward' : 'Reverse';
            this.reverseButton.classList.toggle('active', this.isReversed);
        }
    }
    
    reverseAudioBuffer(buffer) {
        try {
            const reversedBuffer = this.audioContext.createBuffer(
                buffer.numberOfChannels,
                buffer.length,
                buffer.sampleRate
            );
            
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const inputData = buffer.getChannelData(channel);
                const outputData = reversedBuffer.getChannelData(channel);
                
                for (let i = 0; i < inputData.length; i++) {
                    outputData[i] = inputData[inputData.length - 1 - i];
                }
            }
            
            return reversedBuffer;
            
        } catch (error) {
            console.error('Failed to reverse audio buffer:', error);
            return buffer;
        }
    }
    
    clearRecording() {
        // Stop any current playback
        if (this.playbackSource) {
            this.playbackSource.stop();
        }
        
        // Clear current recording
        this.currentAudio = null;
        this.audioChunks = [];
        
        // Update UI
        this.updatePlaybackControls(false);
        
        // Clear analysis
        if (this.analysisElement) {
            this.analysisElement.innerHTML = '';
        }
        
        // Clear waveform
        if (this.waveformContext) {
            this.waveformContext.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        }
        
        // Reset levels
        if (this.audioLevelElement) {
            this.audioLevelElement.textContent = '0';
        }
        if (this.durationElement) {
            this.durationElement.textContent = '0:00';
        }
        
        this.app.addLogEntry('EVP recording cleared', 'evp');
    }
    
    updateRecordingUI(isRecording) {
        if (this.recordButton) {
            if (isRecording) {
                this.recordButton.classList.add('recording');
                this.recordButton.querySelector('.record-text').textContent = 'Stop';
                this.recordButton.querySelector('.record-icon').textContent = '⏹️';
            } else {
                this.recordButton.classList.remove('recording');
                this.recordButton.querySelector('.record-text').textContent = 'Record';
                this.recordButton.querySelector('.record-icon').textContent = '🎙️';
            }
        }
    }
    
    updatePlaybackControls(hasRecording) {
        const controls = [this.playButton, this.slowButton, this.reverseButton, this.clearButton];
        
        controls.forEach(button => {
            if (button) {
                button.disabled = !hasRecording;
            }
        });
    }
}

// Export for use in main app
if (typeof window !== 'undefined') {
    window.AudioProcessor = AudioProcessor;
}