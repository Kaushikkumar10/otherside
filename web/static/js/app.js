// OtherSide Paranormal Investigation App - Main Application
class OtherSideApp {
    constructor() {
        this.currentView = 'sessions';
        this.activeSession = null;
        this.sessionTimer = null;
        this.isOnline = navigator.onLine;
        this.apiBaseUrl = '/api/v1';
        
        // Initialize app components
        this.sessions = [];
        this.currentSessionData = {
            evps: [],
            voxEvents: [],
            radarEvents: [],
            slsDetections: [],
            interactions: []
        };
        
        // Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleNewSession = this.handleNewSession.bind(this);
        this.handleSessionSubmit = this.handleSessionSubmit.bind(this);
        this.updateConnectionStatus = this.updateConnectionStatus.bind(this);
        this.addLogEntry = this.addLogEntry.bind(this);
        
        // Initialize
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing OtherSide application...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check online status
            this.updateConnectionStatus();
            
            // Load sessions
            await this.loadSessions();
            
            // Initialize sub-modules
            if (typeof AudioProcessor !== 'undefined') {
                this.audioProcessor = new AudioProcessor(this);
            }
            
            if (typeof RadarDetector !== 'undefined') {
                this.radarDetector = new RadarDetector(this);
            }
            
            if (typeof SLSDetector !== 'undefined') {
                this.slsDetector = new SLSDetector(this);
            }
            
            // Hide loading screen
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading');
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }
            }, 1000);
            
            console.log('OtherSide application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showAlert('Failed to initialize application', 'error');
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.handleNavigation(view);
            });
        });
        
        // New session modal
        const newSessionBtn = document.getElementById('newSessionBtn');
        const newSessionModal = document.getElementById('newSessionModal');
        const closeModalBtn = document.getElementById('closeModal');
        const cancelSessionBtn = document.getElementById('cancelSession');
        const newSessionForm = document.getElementById('newSessionForm');
        const getLocationBtn = document.getElementById('getLocationBtn');
        
        if (newSessionBtn) {
            newSessionBtn.addEventListener('click', this.handleNewSession);
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideModal('newSessionModal'));
        }
        
        if (cancelSessionBtn) {
            cancelSessionBtn.addEventListener('click', () => this.hideModal('newSessionModal'));
        }
        
        if (newSessionForm) {
            newSessionForm.addEventListener('submit', this.handleSessionSubmit);
        }
        
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', this.getCurrentLocation.bind(this));
        }
        
        // Session log
        const addLogBtn = document.getElementById('addLogBtn');
        const voiceLogBtn = document.getElementById('voiceLogBtn');
        const logInput = document.getElementById('logInput');
        
        if (addLogBtn) {
            addLogBtn.addEventListener('click', () => {
                const input = document.getElementById('logInput');
                if (input && input.value.trim()) {
                    this.addLogEntry(input.value.trim(), 'text');
                    input.value = '';
                }
            });
        }
        
        if (voiceLogBtn) {
            voiceLogBtn.addEventListener('click', this.startVoiceLog.bind(this));
        }
        
        if (logInput) {
            logInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const value = e.target.value.trim();
                    if (value) {
                        this.addLogEntry(value, 'text');
                        e.target.value = '';
                    }
                }
            });
        }
        
        // Online/offline events
        window.addEventListener('online', this.updateConnectionStatus);
        window.addEventListener('offline', this.updateConnectionStatus);
        
        // Analysis session selector
        const analysisSessionSelect = document.getElementById('analysisSessionSelect');
        if (analysisSessionSelect) {
            analysisSessionSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadSessionAnalysis(e.target.value);
                }
            });
        }
        
        // Modal close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                const modalId = e.target.id;
                this.hideModal(modalId);
            }
        });
    }
    
    handleNavigation(view) {
        // Update active nav tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === view) {
                tab.classList.add('active');
            }
        });
        
        // Show/hide views
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.add('hidden');
        });
        
        const targetView = document.getElementById(`${view}View`);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('slide-in');
        }
        
        this.currentView = view;
        
        // Load view-specific data
        if (view === 'analysis') {
            this.populateAnalysisSessionSelect();
        }
    }
    
    async handleNewSession() {
        this.showModal('newSessionModal');
        
        // Pre-populate environmental data if possible
        try {
            // Try to get basic environmental data from device sensors if available
            if ('DeviceMotionEvent' in window) {
                // Device sensors are available
                console.log('Device sensors available for environmental readings');
            }
        } catch (error) {
            console.log('Device sensors not available');
        }
    }
    
    async handleSessionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const sessionData = {
            title: document.getElementById('sessionTitle').value,
            location: {
                address: document.getElementById('sessionAddress').value,
                venue: document.getElementById('sessionVenue').value,
                description: '',
                latitude: 0,
                longitude: 0
            },
            notes: document.getElementById('sessionNotes').value,
            environmental: {
                temperature: parseFloat(document.getElementById('temperature').value) || 0,
                humidity: parseFloat(document.getElementById('humidity').value) || 0,
                pressure: parseFloat(document.getElementById('pressure').value) || 0,
                emf_level: 0,
                light_level: 0,
                noise_level: 0
            }
        };
        
        // Get location coordinates if available
        const coords = await this.getStoredLocation();
        if (coords) {
            sessionData.location.latitude = coords.latitude;
            sessionData.location.longitude = coords.longitude;
        }
        
        try {
            const response = await this.apiRequest('/sessions', 'POST', sessionData);
            
            if (response) {
                this.activeSession = response;
                this.showAlert('Session created successfully!', 'success');
                this.hideModal('newSessionModal');
                this.handleNavigation('investigate');
                this.updateActiveSessionInfo();
                this.startSessionTimer();
                this.addLogEntry(`Session "${sessionData.title}" started`, 'system');
                
                // Refresh sessions list
                await this.loadSessions();
            }
        } catch (error) {
            console.error('Failed to create session:', error);
            this.showAlert('Failed to create session. Please try again.', 'error');
        }
    }
    
    async loadSessions() {
        try {
            if (this.isOnline) {
                const sessions = await this.apiRequest('/sessions');
                if (sessions) {
                    this.sessions = sessions.sessions || [];
                }
            } else {
                // Load from local storage when offline
                const cachedSessions = localStorage.getItem('otherside_sessions');
                if (cachedSessions) {
                    this.sessions = JSON.parse(cachedSessions);
                }
            }
            
            this.renderSessionsList();
            this.populateAnalysisSessionSelect();
            
        } catch (error) {
            console.error('Failed to load sessions:', error);
            // Try to load from cache
            const cachedSessions = localStorage.getItem('otherside_sessions');
            if (cachedSessions) {
                this.sessions = JSON.parse(cachedSessions);
                this.renderSessionsList();
            }
        }
    }
    
    renderSessionsList() {
        const sessionList = document.getElementById('sessionList');
        if (!sessionList) return;
        
        if (this.sessions.length === 0) {
            sessionList.innerHTML = `
                <div class="empty-state">
                    <h3>No Investigation Sessions</h3>
                    <p>Create your first paranormal investigation session to get started.</p>
                    <button class="btn btn-primary" onclick="app.handleNewSession()">Create First Session</button>
                </div>
            `;
            return;
        }
        
        sessionList.innerHTML = this.sessions.map(session => {
            const startDate = new Date(session.start_time);
            const duration = session.end_time 
                ? this.formatDuration((new Date(session.end_time) - startDate) / 1000)
                : 'Active';
                
            return `
                <div class="session-card" onclick="app.selectSession('${session.id}')">
                    <h3>${session.title}</h3>
                    <div class="session-meta">
                        <div>${session.location?.venue || 'Unknown Location'}</div>
                        <div>${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}</div>
                        <div>Duration: ${duration}</div>
                        <div class="session-status status-${session.status}">${session.status}</div>
                    </div>
                    <div class="session-stats">
                        <div class="stat-item">
                            <span class="stat-value">${session.evp_recordings?.length || 0}</span>
                            <span>EVPs</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${session.vox_events?.length || 0}</span>
                            <span>VOX</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${session.radar_events?.length || 0}</span>
                            <span>Radar</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${session.sls_detections?.length || 0}</span>
                            <span>SLS</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async selectSession(sessionId) {
        try {
            const session = await this.apiRequest(`/sessions/${sessionId}`);
            if (session) {
                this.activeSession = session.session;
                this.currentSessionData = {
                    evps: session.evps || [],
                    voxEvents: session.vox_events || [],
                    radarEvents: session.radar_events || [],
                    slsDetections: session.sls_detections || [],
                    interactions: session.interactions || []
                };
                
                this.handleNavigation('investigate');
                this.updateActiveSessionInfo();
                
                if (session.session.status === 'active') {
                    this.startSessionTimer();
                }
                
                this.showAlert(`Session "${session.session.title}" selected`, 'info');
                this.renderSessionLog();
            }
        } catch (error) {
            console.error('Failed to select session:', error);
            this.showAlert('Failed to load session details', 'error');
        }
    }
    
    updateActiveSessionInfo() {
        const titleElement = document.getElementById('activeSessionTitle');
        const timerElement = document.getElementById('sessionTimer');
        
        if (this.activeSession) {
            if (titleElement) {
                titleElement.textContent = this.activeSession.title;
            }
            if (timerElement && this.activeSession.status === 'active') {
                this.updateSessionTimer();
            }
        } else {
            if (titleElement) {
                titleElement.textContent = 'No Active Session';
            }
            if (timerElement) {
                timerElement.textContent = '00:00:00';
            }
        }
    }
    
    startSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }
        
        this.sessionTimer = setInterval(() => {
            this.updateSessionTimer();
        }, 1000);
    }
    
    updateSessionTimer() {
        const timerElement = document.getElementById('sessionTimer');
        if (!timerElement || !this.activeSession) return;
        
        const startTime = new Date(this.activeSession.start_time);
        const now = new Date();
        const duration = Math.floor((now - startTime) / 1000);
        
        timerElement.textContent = this.formatDuration(duration);
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    addLogEntry(content, type = 'user', metadata = null) {
        if (!this.activeSession) {
            this.showAlert('No active session to log to', 'warning');
            return;
        }
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            content: content,
            metadata: metadata
        };
        
        // Add to current session data
        this.currentSessionData.interactions.push({
            id: Date.now().toString(),
            session_id: this.activeSession.id,
            timestamp: logEntry.timestamp,
            type: type,
            content: content,
            created_at: logEntry.timestamp
        });
        
        // Render updated log
        this.renderSessionLog();
        
        // Save to server if online
        if (this.isOnline) {
            this.saveInteraction({
                type: type,
                content: content
            });
        }
    }
    
    renderSessionLog() {
        const logContainer = document.getElementById('sessionLog');
        if (!logContainer) return;
        
        const interactions = this.currentSessionData.interactions || [];
        
        if (interactions.length === 0) {
            logContainer.innerHTML = '<p class="log-placeholder">No log entries yet. Start investigating to see activity here.</p>';
            return;
        }
        
        logContainer.innerHTML = interactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(interaction => {
                const timestamp = new Date(interaction.timestamp);
                return `
                    <div class="log-entry">
                        <span class="log-timestamp">${timestamp.toLocaleTimeString()}</span>
                        <span class="log-content">[${interaction.type.toUpperCase()}] ${interaction.content}</span>
                    </div>
                `;
            }).join('');
        
        // Scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    async saveInteraction(interactionData) {
        if (!this.activeSession || !this.isOnline) return;
        
        try {
            await this.apiRequest(`/sessions/${this.activeSession.id}/interactions`, 'POST', interactionData);
        } catch (error) {
            console.error('Failed to save interaction:', error);
        }
    }
    
    async startVoiceLog() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showAlert('Speech recognition not supported in this browser', 'error');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        const voiceLogBtn = document.getElementById('voiceLogBtn');
        
        recognition.onstart = () => {
            if (voiceLogBtn) {
                voiceLogBtn.textContent = '🔴';
                voiceLogBtn.disabled = true;
            }
            this.showAlert('Listening for voice input...', 'info');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                this.addLogEntry(transcript.trim(), 'voice');
                const logInput = document.getElementById('logInput');
                if (logInput) {
                    logInput.value = transcript.trim();
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showAlert('Speech recognition failed', 'error');
        };
        
        recognition.onend = () => {
            if (voiceLogBtn) {
                voiceLogBtn.textContent = '🎤';
                voiceLogBtn.disabled = false;
            }
        };
        
        recognition.start();
    }
    
    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showAlert('Geolocation not supported', 'error');
            return;
        }
        
        const getLocationBtn = document.getElementById('getLocationBtn');
        if (getLocationBtn) {
            getLocationBtn.textContent = 'Getting location...';
            getLocationBtn.disabled = true;
        }
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
            });
            
            const { latitude, longitude } = position.coords;
            
            // Store coordinates
            localStorage.setItem('otherside_location', JSON.stringify({ latitude, longitude }));
            
            // Try to get address using reverse geocoding (if available)
            try {
                // This would typically use a geocoding service
                const addressField = document.getElementById('sessionAddress');
                if (addressField) {
                    addressField.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                }
                
                this.showAlert('Location captured successfully', 'success');
            } catch (error) {
                console.log('Reverse geocoding not available');
                const addressField = document.getElementById('sessionAddress');
                if (addressField) {
                    addressField.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                }
                this.showAlert('Location coordinates captured', 'success');
            }
            
        } catch (error) {
            console.error('Geolocation error:', error);
            this.showAlert('Failed to get location', 'error');
        } finally {
            if (getLocationBtn) {
                getLocationBtn.textContent = 'Use Current Location';
                getLocationBtn.disabled = false;
            }
        }
    }
    
    async getStoredLocation() {
        const stored = localStorage.getItem('otherside_location');
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    }
    
    populateAnalysisSessionSelect() {
        const select = document.getElementById('analysisSessionSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select a session...</option>' +
            this.sessions.map(session => 
                `<option value="${session.id}">${session.title} (${new Date(session.start_time).toLocaleDateString()})</option>`
            ).join('');
    }
    
    async loadSessionAnalysis(sessionId) {
        try {
            const session = await this.apiRequest(`/sessions/${sessionId}`);
            if (session) {
                this.renderSessionAnalysis(session);
            }
        } catch (error) {
            console.error('Failed to load session analysis:', error);
            this.showAlert('Failed to load session analysis', 'error');
        }
    }
    
    renderSessionAnalysis(sessionData) {
        const dashboard = document.getElementById('analysisDashboard');
        if (!dashboard) return;
        
        const session = sessionData.session;
        const stats = sessionData.statistics;
        
        dashboard.innerHTML = `
            <div class="analysis-overview">
                <h2>${session.title}</h2>
                <div class="analysis-grid">
                    <div class="analysis-card">
                        <h3>Session Overview</h3>
                        <div class="analysis-stats">
                            <div class="stat-row">
                                <span>Location:</span>
                                <span>${session.location?.venue || 'Unknown'}</span>
                            </div>
                            <div class="stat-row">
                                <span>Duration:</span>
                                <span>${session.end_time ? this.formatDuration((new Date(session.end_time) - new Date(session.start_time)) / 1000) : 'Ongoing'}</span>
                            </div>
                            <div class="stat-row">
                                <span>Status:</span>
                                <span class="status-${session.status}">${session.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h3>Detection Summary</h3>
                        <div class="detection-grid">
                            <div class="detection-item">
                                <span class="detection-count">${stats?.total_evps || 0}</span>
                                <span class="detection-label">EVP Recordings</span>
                                <span class="detection-quality">${stats?.high_quality_evps || 0} high quality</span>
                            </div>
                            <div class="detection-item">
                                <span class="detection-count">${stats?.total_vox_events || 0}</span>
                                <span class="detection-label">VOX Communications</span>
                            </div>
                            <div class="detection-item">
                                <span class="detection-count">${stats?.total_radar_events || 0}</span>
                                <span class="detection-label">Radar Detections</span>
                            </div>
                            <div class="detection-item">
                                <span class="detection-count">${stats?.total_sls_detections || 0}</span>
                                <span class="detection-label">SLS Detections</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h3>Quality Metrics</h3>
                        <div class="quality-metrics">
                            <div class="metric-item">
                                <span>Average Anomaly Strength</span>
                                <div class="metric-bar">
                                    <div class="metric-fill" style="width: ${(stats?.average_anomaly_strength || 0) * 100}%"></div>
                                </div>
                                <span>${((stats?.average_anomaly_strength || 0) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-details">
                <div class="analysis-tabs">
                    <button class="analysis-tab active" data-tab="evp">EVP Analysis</button>
                    <button class="analysis-tab" data-tab="vox">VOX Communications</button>
                    <button class="analysis-tab" data-tab="radar">Radar Events</button>
                    <button class="analysis-tab" data-tab="sls">SLS Detections</button>
                </div>
                
                <div class="analysis-content">
                    <!-- Content will be populated based on selected tab -->
                </div>
            </div>
        `;
        
        // Add event listeners for analysis tabs
        dashboard.querySelectorAll('.analysis-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                dashboard.querySelectorAll('.analysis-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const tabType = e.target.dataset.tab;
                this.renderAnalysisTab(tabType, sessionData);
            });
        });
        
        // Load default EVP tab
        this.renderAnalysisTab('evp', sessionData);
    }
    
    renderAnalysisTab(tabType, sessionData) {
        const content = document.querySelector('.analysis-content');
        if (!content) return;
        
        switch (tabType) {
            case 'evp':
                content.innerHTML = this.renderEVPAnalysis(sessionData.evps || []);
                break;
            case 'vox':
                content.innerHTML = this.renderVOXAnalysis(sessionData.vox_events || []);
                break;
            case 'radar':
                content.innerHTML = this.renderRadarAnalysis(sessionData.radar_events || []);
                break;
            case 'sls':
                content.innerHTML = this.renderSLSAnalysis(sessionData.sls_detections || []);
                break;
        }
    }
    
    renderEVPAnalysis(evps) {
        if (evps.length === 0) {
            return '<p class="analysis-empty">No EVP recordings found in this session.</p>';
        }
        
        return `
            <div class="evp-analysis-list">
                ${evps.map((evp, index) => `
                    <div class="evp-item">
                        <div class="evp-header">
                            <h4>EVP Recording #${index + 1}</h4>
                            <span class="evp-quality quality-${evp.quality}">${evp.quality}</span>
                        </div>
                        <div class="evp-details">
                            <div class="evp-meta">
                                <span>Duration: ${evp.duration.toFixed(2)}s</span>
                                <span>Detection Level: ${(evp.detection_level * 100).toFixed(1)}%</span>
                                <span>Recorded: ${new Date(evp.timestamp).toLocaleString()}</span>
                            </div>
                            ${evp.annotations && evp.annotations.length > 0 ? `
                                <div class="evp-annotations">
                                    <strong>Annotations:</strong>
                                    <ul>
                                        ${evp.annotations.map(annotation => `<li>${annotation}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderVOXAnalysis(voxEvents) {
        if (voxEvents.length === 0) {
            return '<p class="analysis-empty">No VOX communications found in this session.</p>';
        }
        
        return `
            <div class="vox-analysis-list">
                ${voxEvents.map((vox, index) => `
                    <div class="vox-item">
                        <div class="vox-header">
                            <h4>VOX Communication #${index + 1}</h4>
                            <span class="vox-strength">Strength: ${(vox.trigger_strength * 100).toFixed(1)}%</span>
                        </div>
                        <div class="vox-details">
                            <div class="vox-text">"${vox.generated_text}"</div>
                            <div class="vox-meta">
                                <span>Language: ${vox.language_pack}</span>
                                <span>Bank: ${vox.phonetic_bank}</span>
                                <span>Time: ${new Date(vox.timestamp).toLocaleTimeString()}</span>
                            </div>
                            ${vox.user_response ? `
                                <div class="vox-response">
                                    <strong>Response:</strong> ${vox.user_response}
                                    <span class="response-delay">(${vox.response_delay.toFixed(1)}s delay)</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderRadarAnalysis(radarEvents) {
        if (radarEvents.length === 0) {
            return '<p class="analysis-empty">No radar events found in this session.</p>';
        }
        
        return `
            <div class="radar-analysis-list">
                ${radarEvents.map((radar, index) => `
                    <div class="radar-item">
                        <div class="radar-header">
                            <h4>Radar Detection #${index + 1}</h4>
                            <span class="radar-type type-${radar.source_type}">${radar.source_type}</span>
                        </div>
                        <div class="radar-details">
                            <div class="radar-position">
                                <strong>Position:</strong> (${radar.position.x.toFixed(2)}, ${radar.position.y.toFixed(2)})
                            </div>
                            <div class="radar-meta">
                                <span>Strength: ${(radar.strength * 100).toFixed(1)}%</span>
                                <span>EMF: ${radar.emf_reading.toFixed(2)} mG</span>
                                <span>Duration: ${radar.duration.toFixed(1)}s</span>
                                <span>Time: ${new Date(radar.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderSLSAnalysis(slsDetections) {
        if (slsDetections.length === 0) {
            return '<p class="analysis-empty">No SLS detections found in this session.</p>';
        }
        
        return `
            <div class="sls-analysis-list">
                ${slsDetections.map((sls, index) => `
                    <div class="sls-item">
                        <div class="sls-header">
                            <h4>SLS Detection #${index + 1}</h4>
                            <span class="sls-confidence">${(sls.confidence * 100).toFixed(1)}% confidence</span>
                        </div>
                        <div class="sls-details">
                            <div class="sls-skeletal">
                                <strong>Skeletal Points:</strong> ${sls.skeletal_points.length} detected
                            </div>
                            <div class="sls-meta">
                                <span>Duration: ${sls.duration.toFixed(1)}s</span>
                                <span>Movement: ${sls.movement.pattern}</span>
                                <span>Time: ${new Date(sls.timestamp).toLocaleTimeString()}</span>
                            </div>
                            ${sls.filter_applied && sls.filter_applied.length > 0 ? `
                                <div class="sls-filters">
                                    <strong>Filters Applied:</strong> ${sls.filter_applied.join(', ')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    updateConnectionStatus() {
        this.isOnline = navigator.onLine;
        
        const statusIndicator = document.getElementById('connectionStatus');
        const offlineIndicator = document.getElementById('offlineIndicator');
        
        if (statusIndicator) {
            statusIndicator.textContent = this.isOnline ? 'Online' : 'Offline';
            statusIndicator.className = `status-indicator ${this.isOnline ? 'online' : 'offline'}`;
        }
        
        if (offlineIndicator) {
            if (this.isOnline) {
                offlineIndicator.classList.add('hidden');
            } else {
                offlineIndicator.classList.remove('hidden');
            }
        }
        
        if (this.isOnline) {
            this.syncOfflineData();
        }
    }
    
    async syncOfflineData() {
        // Sync any offline data when coming back online
        const offlineData = localStorage.getItem('otherside_offline_data');
        if (offlineData) {
            try {
                const data = JSON.parse(offlineData);
                // Process offline data
                console.log('Syncing offline data:', data);
                
                // Clear offline data after successful sync
                localStorage.removeItem('otherside_offline_data');
                
                this.showAlert('Offline data synchronized', 'success');
                
                // Reload sessions
                await this.loadSessions();
                
            } catch (error) {
                console.error('Failed to sync offline data:', error);
            }
        }
    }
    
    async apiRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Cache successful responses
            if (method === 'GET') {
                const cacheKey = `otherside_cache_${endpoint.replace(/\//g, '_')}`;
                localStorage.setItem(cacheKey, JSON.stringify(result));
            }
            
            return result;
            
        } catch (error) {
            console.error('API request failed:', error);
            
            // Try to return cached data for GET requests
            if (method === 'GET') {
                const cacheKey = `otherside_cache_${endpoint.replace(/\//g, '_')}`;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    console.log('Using cached data for', endpoint);
                    return JSON.parse(cached);
                }
            }
            
            throw error;
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    showAlert(message, type = 'info', duration = 5000) {
        const alertsContainer = document.getElementById('alerts');
        if (!alertsContainer) return;
        
        const alertId = Date.now().toString();
        const alertElement = document.createElement('div');
        alertElement.className = `alert ${type}`;
        alertElement.id = alertId;
        alertElement.innerHTML = `
            <div class="alert-content">
                <span>${message}</span>
                <button class="alert-close" onclick="app.closeAlert('${alertId}')">&times;</button>
            </div>
        `;
        
        alertsContainer.appendChild(alertElement);
        
        // Animate in
        setTimeout(() => {
            alertElement.classList.add('show');
        }, 100);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.closeAlert(alertId);
        }, duration);
    }
    
    closeAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OtherSideApp();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OtherSideApp;
}