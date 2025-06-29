<template>
  <div class="live-view">
    <h1>Live Camera View</h1>
    
    <div class="row mt-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Camera Feed</h5>
            <div>
              <button @click="startCamera" class="btn btn-success me-2" :disabled="isStreaming">Start</button>
              <button @click="stopCamera" class="btn btn-danger" :disabled="!isStreaming">Stop</button>
            </div>
          </div>
          <div class="card-body">
            <div class="video-container">
              <!-- Local webcam video element -->
              <video v-if="!isRtspStream" ref="videoElement" autoplay playsinline class="w-100"></video>
              
              <!-- RTSP stream canvas -->
              <div v-if="isRtspStream" ref="rtspPlayer" class="rtsp-player"></div>
              
              <canvas ref="canvasElement" style="display: none;"></canvas>
              <div v-if="!isStreaming" class="video-placeholder d-flex align-items-center justify-content-center">
                <p class="text-muted">Camera feed not active</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-3">
          <button @click="takeSnapshot" class="btn btn-primary" :disabled="!isStreaming">Take Snapshot</button>
          <button @click="toggleRecording" class="btn" :class="isRecording ? 'btn-danger' : 'btn-success'" :disabled="!isStreaming || isRtspStream">
            {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
          </button>
          <small v-if="isRtspStream" class="text-muted ms-2">
            (Recording not available for RTSP streams in browser)
          </small>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Camera Settings</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="cameraTypeSelect" class="form-label">Camera Type</label>
              <select id="cameraTypeSelect" class="form-select" v-model="cameraType" @change="handleCameraTypeChange">
                <option value="webcam">Local Webcam</option>
                <option value="rtsp">IP Camera (RTSP)</option>
              </select>
            </div>
            
            <!-- Webcam settings -->
            <div v-if="cameraType === 'webcam'">
              <div class="mb-3">
                <label for="cameraSelect" class="form-label">Select Camera</label>
                <select id="cameraSelect" class="form-select" v-model="selectedCamera" @change="changeCameraSource">
                  <option v-for="camera in availableCameras" :key="camera.deviceId" :value="camera.deviceId">
                    {{ camera.label || `Camera ${camera.deviceId.substring(0, 5)}...` }}
                  </option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="resolutionSelect" class="form-label">Resolution</label>
                <select id="resolutionSelect" class="form-select" v-model="selectedResolution" @change="changeResolution">
                  <option value="640x480">640x480</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                </select>
              </div>
            </div>
            
            <!-- RTSP settings -->
            <div v-if="cameraType === 'rtsp'">
              <div class="mb-3">
                <label for="rtspUrl" class="form-label">RTSP URL</label>
                <input 
                  type="text" 
                  id="rtspUrl" 
                  class="form-control" 
                  v-model="rtspUrl" 
                  placeholder="rtsp://username:password@ip:port/channel"
                />
                <small class="form-text text-muted">
                  Example for Hikvision: rtsp://admin:password@192.168.1.64:554/Streaming/Channels/101
                </small>
              </div>
              
              <div class="mb-3">
                <label for="streamId" class="form-label">Stream ID</label>
                <input 
                  type="text" 
                  id="streamId" 
                  class="form-control" 
                  v-model="streamId" 
                  placeholder="camera1"
                />
                <small class="form-text text-muted">
                  Unique identifier for this camera stream
                </small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mt-3" v-if="snapshots.length > 0">
          <div class="card-header">
            <h5 class="mb-0">Recent Snapshots</h5>
          </div>
          <div class="card-body">
            <div class="snapshots-container">
              <div v-for="(snapshot, index) in snapshots" :key="index" class="snapshot-item mb-2">
                <img :src="snapshot.dataUrl" class="img-thumbnail" />
                <div class="d-flex justify-content-between mt-1">
                  <small>{{ snapshot.timestamp }}</small>
                  <div>
                    <button @click="downloadSnapshot(snapshot)" class="btn btn-sm btn-outline-primary me-1">
                      <i class="bi bi-download"></i>
                    </button>
                    <button @click="deleteSnapshot(index)" class="btn btn-sm btn-outline-danger">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JSMpeg from '@cycjimmy/jsmpeg-player';
import axios from 'axios';

export default {
  name: 'LiveView',
  data() {
    return {
      isStreaming: false,
      isRecording: false,
      isRtspStream: false,
      mediaStream: null,
      mediaRecorder: null,
      recordedChunks: [],
      availableCameras: [],
      selectedCamera: '',
      selectedResolution: '640x480',
      snapshots: [],
      recordingStartTime: null,
      cameraType: 'webcam',
      rtspUrl: '',
      streamId: 'camera1',
      jsmpegPlayer: null,
      proxyServerUrl: 'http://localhost:12001', // RTSP proxy server URL
    };
  },
  mounted() {
    this.getAvailableCameras();
  },
  beforeUnmount() {
    this.stopCamera();
  },
  methods: {
    handleCameraTypeChange() {
      if (this.isStreaming) {
        this.stopCamera();
      }
    },
    
    async getAvailableCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableCameras = devices.filter(device => device.kind === 'videoinput');
        
        if (this.availableCameras.length > 0) {
          this.selectedCamera = this.availableCameras[0].deviceId;
        }
      } catch (error) {
        console.error('Error getting camera devices:', error);
        alert('Failed to get camera devices. Please check camera permissions.');
      }
    },
    
    async startCamera() {
      if (this.cameraType === 'webcam') {
        await this.startWebcam();
      } else if (this.cameraType === 'rtsp') {
        await this.startRtspStream();
      }
    },
    
    async startWebcam() {
      try {
        const [width, height] = this.selectedResolution.split('x').map(Number);
        
        const constraints = {
          video: {
            deviceId: this.selectedCamera ? { exact: this.selectedCamera } : undefined,
            width: { ideal: width },
            height: { ideal: height }
          },
          audio: false
        };
        
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = this.$refs.videoElement;
        videoElement.srcObject = this.mediaStream;
        this.isStreaming = true;
        this.isRtspStream = false;
      } catch (error) {
        console.error('Error starting webcam:', error);
        alert('Failed to start webcam. Please check camera permissions.');
      }
    },
    
    async startRtspStream() {
      if (!this.rtspUrl || !this.streamId) {
        alert('Please enter RTSP URL and Stream ID');
        return;
      }
      
      try {
        // Request the proxy server to start streaming
        await axios.post(`${this.proxyServerUrl}/api/stream`, {
          rtspUrl: this.rtspUrl,
          streamId: this.streamId
        });
        
        // Create JSMpeg player
        if (this.jsmpegPlayer) {
          this.jsmpegPlayer.destroy();
        }
        
        // Clear the container
        const playerElement = this.$refs.rtspPlayer;
        playerElement.innerHTML = '';
        
        // Create new player
        const wsUrl = `ws://${window.location.hostname}:12001?streamId=${this.streamId}`;
        this.jsmpegPlayer = new JSMpeg.Player(wsUrl, {
          canvas: playerElement,
          autoplay: true,
          audio: false,
          loop: false
        });
        
        this.isStreaming = true;
        this.isRtspStream = true;
      } catch (error) {
        console.error('Error starting RTSP stream:', error);
        alert(`Failed to start RTSP stream: ${error.message}`);
      }
    },
    
    stopCamera() {
      if (this.isRecording) {
        this.stopRecording();
      }
      
      if (this.cameraType === 'webcam') {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        }
        
        const videoElement = this.$refs.videoElement;
        if (videoElement) {
          videoElement.srcObject = null;
        }
      } else if (this.cameraType === 'rtsp') {
        if (this.jsmpegPlayer) {
          this.jsmpegPlayer.destroy();
          this.jsmpegPlayer = null;
        }
        
        // Tell the proxy server to stop streaming
        if (this.streamId) {
          axios.post(`${this.proxyServerUrl}/api/stop`, {
            streamId: this.streamId
          }).catch(error => {
            console.error('Error stopping RTSP stream:', error);
          });
        }
      }
      
      this.isStreaming = false;
      this.isRtspStream = false;
    },
    
    async changeCameraSource() {
      if (this.isStreaming && this.cameraType === 'webcam') {
        await this.stopCamera();
        await this.startWebcam();
      }
    },
    
    async changeResolution() {
      if (this.isStreaming && this.cameraType === 'webcam') {
        await this.stopCamera();
        await this.startWebcam();
      }
    },
    
    takeSnapshot() {
      if (!this.isStreaming) return;
      
      if (this.cameraType === 'webcam') {
        this.takeWebcamSnapshot();
      } else if (this.cameraType === 'rtsp') {
        this.takeRtspSnapshot();
      }
    },
    
    takeWebcamSnapshot() {
      const videoElement = this.$refs.videoElement;
      const canvasElement = this.$refs.canvasElement;
      
      // Set canvas dimensions to match video
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      
      // Draw video frame to canvas
      const context = canvasElement.getContext('2d');
      context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      // Get image data URL
      const dataUrl = canvasElement.toDataURL('image/png');
      
      // Create timestamp
      const now = new Date();
      const timestamp = now.toLocaleString();
      
      // Add to snapshots
      this.snapshots.unshift({ dataUrl, timestamp });
      
      // Limit number of snapshots shown
      if (this.snapshots.length > 5) {
        this.snapshots.pop();
      }
    },
    
    takeRtspSnapshot() {
      if (!this.jsmpegPlayer) return;
      
      // Get the canvas from JSMpeg player
      const canvas = this.$refs.rtspPlayer.querySelector('canvas');
      if (!canvas) return;
      
      // Get image data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create timestamp
      const now = new Date();
      const timestamp = now.toLocaleString();
      
      // Add to snapshots
      this.snapshots.unshift({ dataUrl, timestamp });
      
      // Limit number of snapshots shown
      if (this.snapshots.length > 5) {
        this.snapshots.pop();
      }
    },
    
    downloadSnapshot(snapshot) {
      const link = document.createElement('a');
      link.href = snapshot.dataUrl;
      link.download = `snapshot_${new Date().toISOString().replace(/:/g, '-')}.png`;
      link.click();
    },
    
    deleteSnapshot(index) {
      this.snapshots.splice(index, 1);
    },
    
    toggleRecording() {
      if (this.isRtspStream) return; // Not available for RTSP streams
      
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },
    
    startRecording() {
      if (!this.isStreaming || this.isRtspStream) return;
      
      this.recordedChunks = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      try {
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      } catch (e) {
        console.error('MediaRecorder error:', e);
        try {
          // Try with a different MIME type
          this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType: 'video/webm' });
        } catch (e2) {
          console.error('MediaRecorder fallback error:', e2);
          alert('Recording not supported in this browser');
          return;
        }
      }
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = this.saveRecording;
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.recordingStartTime = new Date();
    },
    
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
    },
    
    saveRecording() {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Format timestamp for filename
      const timestamp = this.recordingStartTime.toISOString().replace(/:/g, '-');
      
      a.style.display = 'none';
      a.href = url;
      a.download = `recording_${timestamp}.webm`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  }
};
</script>

<style scoped>
.video-container {
  position: relative;
  background-color: #000;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  border: 1px dashed #dee2e6;
}

.snapshots-container {
  max-height: 400px;
  overflow-y: auto;
}

.snapshot-item img {
  width: 100%;
  height: auto;
}

.rtsp-player {
  width: 100%;
  height: 100%;
  background-color: #000;
}

.rtsp-player canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>