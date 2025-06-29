<template>
  <div class="settings-view">
    <h1>Camera Settings</h1>
    
    <div class="row mt-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Camera Configuration</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveGeneralSettings">
              <div class="mb-3">
                <label for="cameraName" class="form-label">Camera Name</label>
                <input type="text" id="cameraName" class="form-control" v-model="settings.cameraName">
              </div>
              
              <div class="mb-3">
                <label for="defaultResolution" class="form-label">Default Resolution</label>
                <select id="defaultResolution" class="form-select" v-model="settings.defaultResolution">
                  <option value="640x480">640x480</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="frameRate" class="form-label">Frame Rate</label>
                <select id="frameRate" class="form-select" v-model="settings.frameRate">
                  <option value="15">15 fps</option>
                  <option value="24">24 fps</option>
                  <option value="30">30 fps</option>
                  <option value="60">60 fps</option>
                </select>
              </div>
              
              <div class="mb-3 form-check">
                <input type="checkbox" id="autoStart" class="form-check-input" v-model="settings.autoStart">
                <label for="autoStart" class="form-check-label">Auto-start camera on page load</label>
              </div>
              
              <button type="submit" class="btn btn-primary">Save Camera Settings</button>
            </form>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Recording Settings</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveRecordingSettings">
              <div class="mb-3">
                <label for="videoFormat" class="form-label">Video Format</label>
                <select id="videoFormat" class="form-select" v-model="recordingSettings.videoFormat">
                  <option value="webm">WebM</option>
                  <option value="mp4">MP4</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="videoQuality" class="form-label">Video Quality</label>
                <select id="videoQuality" class="form-select" v-model="recordingSettings.videoQuality">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="maxRecordingTime" class="form-label">Maximum Recording Time (minutes)</label>
                <input type="number" id="maxRecordingTime" class="form-control" v-model="recordingSettings.maxRecordingTime" min="1" max="60">
              </div>
              
              <div class="mb-3">
                <label for="storageLocation" class="form-label">Storage Location</label>
                <input type="text" id="storageLocation" class="form-control" v-model="recordingSettings.storageLocation">
              </div>
              
              <div class="mb-3 form-check">
                <input type="checkbox" id="enableTimestamp" class="form-check-input" v-model="recordingSettings.enableTimestamp">
                <label for="enableTimestamp" class="form-check-label">Add timestamp to recordings</label>
              </div>
              
              <button type="submit" class="btn btn-primary">Save Recording Settings</button>
            </form>
          </div>
        </div>
        
        <div class="card mt-3">
          <div class="card-header">
            <h5 class="mb-0">Storage Management</h5>
          </div>
          <div class="card-body">
            <div class="storage-usage mb-3">
              <label class="form-label">Storage Usage</label>
              <div class="progress">
                <div class="progress-bar" role="progressbar" :style="{ width: storageUsage + '%' }" :aria-valuenow="storageUsage" aria-valuemin="0" aria-valuemax="100">
                  {{ storageUsage }}%
                </div>
              </div>
              <small class="text-muted">{{ usedStorage }} / {{ totalStorage }} used</small>
            </div>
            
            <div class="mb-3">
              <label for="retentionPeriod" class="form-label">Auto-delete recordings older than</label>
              <select id="retentionPeriod" class="form-select" v-model="storageSettings.retentionPeriod">
                <option value="never">Never delete</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            
            <div class="d-grid gap-2">
              <button @click="cleanupStorage" class="btn btn-warning">Clean Up Old Recordings</button>
              <button @click="confirmClearStorage" class="btn btn-danger">Clear All Recordings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Advanced Settings</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="rtspUrl" class="form-label">RTSP URL (for IP cameras)</label>
                  <input type="text" id="rtspUrl" class="form-control" v-model="advancedSettings.rtspUrl" placeholder="rtsp://username:password@camera-ip:port/stream">
                </div>
                
                <div class="mb-3">
                  <label for="apiEndpoint" class="form-label">API Endpoint</label>
                  <input type="text" id="apiEndpoint" class="form-control" v-model="advancedSettings.apiEndpoint">
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="motionSensitivity" class="form-label">Motion Detection Sensitivity</label>
                  <input type="range" class="form-range" id="motionSensitivity" v-model="advancedSettings.motionSensitivity" min="0" max="100">
                  <div class="d-flex justify-content-between">
                    <small>Low</small>
                    <small>Medium</small>
                    <small>High</small>
                  </div>
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" id="enableNotifications" class="form-check-input" v-model="advancedSettings.enableNotifications">
                  <label for="enableNotifications" class="form-check-label">Enable motion detection notifications</label>
                </div>
              </div>
            </div>
            
            <button @click="saveAdvancedSettings" class="btn btn-primary">Save Advanced Settings</button>
            <button @click="resetToDefaults" class="btn btn-outline-secondary ms-2">Reset to Defaults</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  data() {
    return {
      settings: {
        cameraName: 'Main Camera',
        defaultResolution: '1280x720',
        frameRate: '30',
        autoStart: false
      },
      recordingSettings: {
        videoFormat: 'webm',
        videoQuality: 'high',
        maxRecordingTime: 10,
        storageLocation: '/recordings',
        enableTimestamp: true
      },
      storageSettings: {
        retentionPeriod: '30'
      },
      advancedSettings: {
        rtspUrl: '',
        apiEndpoint: 'http://localhost:3000/api',
        motionSensitivity: 50,
        enableNotifications: false
      },
      storageUsage: 45,
      usedStorage: '4.5 GB',
      totalStorage: '10 GB'
    };
  },
  methods: {
    saveGeneralSettings() {
      // In a real application, this would save to localStorage or call an API
      alert('Camera settings saved successfully!');
      
      // Save to localStorage for demonstration
      localStorage.setItem('cameraSettings', JSON.stringify(this.settings));
    },
    
    saveRecordingSettings() {
      // In a real application, this would save to localStorage or call an API
      alert('Recording settings saved successfully!');
      
      // Save to localStorage for demonstration
      localStorage.setItem('recordingSettings', JSON.stringify(this.recordingSettings));
    },
    
    saveAdvancedSettings() {
      // In a real application, this would save to localStorage or call an API
      alert('Advanced settings saved successfully!');
      
      // Save to localStorage for demonstration
      localStorage.setItem('advancedSettings', JSON.stringify(this.advancedSettings));
    },
    
    cleanupStorage() {
      // In a real application, this would call an API to clean up old recordings
      alert(`Cleaning up recordings older than ${this.storageSettings.retentionPeriod} days...`);
      
      // Simulate cleanup
      setTimeout(() => {
        this.storageUsage = 30;
        this.usedStorage = '3.0 GB';
        alert('Storage cleanup completed!');
      }, 1500);
    },
    
    confirmClearStorage() {
      if (confirm('Are you sure you want to delete ALL recordings? This action cannot be undone.')) {
        // In a real application, this would call an API to delete all recordings
        alert('Deleting all recordings...');
        
        // Simulate deletion
        setTimeout(() => {
          this.storageUsage = 0;
          this.usedStorage = '0 GB';
          alert('All recordings have been deleted.');
        }, 1500);
      }
    },
    
    resetToDefaults() {
      if (confirm('Are you sure you want to reset all settings to default values?')) {
        this.settings = {
          cameraName: 'Main Camera',
          defaultResolution: '1280x720',
          frameRate: '30',
          autoStart: false
        };
        
        this.recordingSettings = {
          videoFormat: 'webm',
          videoQuality: 'high',
          maxRecordingTime: 10,
          storageLocation: '/recordings',
          enableTimestamp: true
        };
        
        this.advancedSettings = {
          rtspUrl: '',
          apiEndpoint: 'http://localhost:3000/api',
          motionSensitivity: 50,
          enableNotifications: false
        };
        
        // Clear localStorage
        localStorage.removeItem('cameraSettings');
        localStorage.removeItem('recordingSettings');
        localStorage.removeItem('advancedSettings');
        
        alert('All settings have been reset to default values.');
      }
    }
  },
  mounted() {
    // Load settings from localStorage if available
    const savedCameraSettings = localStorage.getItem('cameraSettings');
    if (savedCameraSettings) {
      this.settings = JSON.parse(savedCameraSettings);
    }
    
    const savedRecordingSettings = localStorage.getItem('recordingSettings');
    if (savedRecordingSettings) {
      this.recordingSettings = JSON.parse(savedRecordingSettings);
    }
    
    const savedAdvancedSettings = localStorage.getItem('advancedSettings');
    if (savedAdvancedSettings) {
      this.advancedSettings = JSON.parse(savedAdvancedSettings);
    }
  }
};
</script>

<style scoped>
.settings-view {
  margin-bottom: 3rem;
}

.card {
  margin-bottom: 1.5rem;
}

.storage-usage {
  margin-bottom: 1.5rem;
}

.progress {
  height: 1.5rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  background-color: #28a745;
}
</style>