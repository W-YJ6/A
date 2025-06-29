<template>
  <div class="history-view">
    <h1>Video History</h1>
    
    <div class="row mt-4">
      <div class="col-md-3">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Filters</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="dateFilter" class="form-label">Date</label>
              <input type="date" id="dateFilter" class="form-control" v-model="filters.date">
            </div>
            
            <div class="mb-3">
              <label for="typeFilter" class="form-label">Type</label>
              <select id="typeFilter" class="form-select" v-model="filters.type">
                <option value="all">All</option>
                <option value="video">Videos</option>
                <option value="image">Images</option>
              </select>
            </div>
            
            <div class="mb-3">
              <label for="cameraFilter" class="form-label">Camera</label>
              <select id="cameraFilter" class="form-select" v-model="filters.camera">
                <option value="all">All Cameras</option>
                <option value="camera1">Camera 1</option>
                <option value="camera2">Camera 2</option>
              </select>
            </div>
            
            <button @click="applyFilters" class="btn btn-primary w-100">Apply Filters</button>
          </div>
        </div>
        
        <div class="card mt-3">
          <div class="card-header">
            <h5 class="mb-0">Calendar</h5>
          </div>
          <div class="card-body">
            <div class="calendar-container">
              <!-- Simple calendar display -->
              <div class="calendar-header d-flex justify-content-between align-items-center mb-2">
                <button @click="prevMonth" class="btn btn-sm btn-outline-secondary">&lt;</button>
                <span>{{ currentMonthName }} {{ currentYear }}</span>
                <button @click="nextMonth" class="btn btn-sm btn-outline-secondary">&gt;</button>
              </div>
              
              <div class="calendar-grid">
                <div class="calendar-day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
                <div 
                  v-for="(day, index) in calendarDays" 
                  :key="index"
                  class="calendar-day" 
                  :class="{ 
                    'empty': !day, 
                    'has-recordings': day && hasRecordingsOnDay(day),
                    'current-day': isCurrentDay(day)
                  }"
                  @click="day && selectDay(day)"
                >
                  {{ day }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-9">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Recordings</h5>
            <div class="btn-group">
              <button @click="viewMode = 'grid'" class="btn btn-outline-secondary" :class="{ active: viewMode === 'grid' }">
                Grid
              </button>
              <button @click="viewMode = 'list'" class="btn btn-outline-secondary" :class="{ active: viewMode === 'list' }">
                List
              </button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading recordings...</p>
            </div>
            
            <div v-else-if="filteredRecordings.length === 0" class="text-center py-5">
              <p class="text-muted">No recordings found matching your criteria</p>
            </div>
            
            <div v-else>
              <!-- Grid View -->
              <div v-if="viewMode === 'grid'" class="recordings-grid">
                <div v-for="(recording, index) in filteredRecordings" :key="index" class="recording-card">
                  <div class="recording-thumbnail" @click="selectRecording(recording)">
                    <img v-if="recording.type === 'image'" :src="recording.thumbnail" alt="Recording thumbnail">
                    <div v-else class="video-thumbnail">
                      <img :src="recording.thumbnail" alt="Video thumbnail">
                      <span class="duration-badge">{{ formatDuration(recording.duration) }}</span>
                      <div class="play-icon">▶</div>
                    </div>
                  </div>
                  <div class="recording-info">
                    <div class="recording-time">{{ formatTime(recording.timestamp) }}</div>
                    <div class="recording-camera">{{ recording.camera }}</div>
                    <div class="recording-actions">
                      <button @click="downloadRecording(recording)" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-download"></i>
                      </button>
                      <button @click="deleteRecording(recording)" class="btn btn-sm btn-outline-danger ms-1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- List View -->
              <div v-else class="recordings-list">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Timestamp</th>
                      <th>Camera</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(recording, index) in filteredRecordings" :key="index" @click="selectRecording(recording)">
                      <td>
                        <i :class="recording.type === 'video' ? 'bi bi-camera-video' : 'bi bi-camera'"></i>
                        {{ recording.type === 'video' ? 'Video' : 'Image' }}
                      </td>
                      <td>{{ formatDateTime(recording.timestamp) }}</td>
                      <td>{{ recording.camera }}</td>
                      <td>{{ recording.type === 'video' ? formatDuration(recording.duration) : '-' }}</td>
                      <td>
                        <button @click.stop="downloadRecording(recording)" class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-download"></i>
                        </button>
                        <button @click.stop="deleteRecording(recording)" class="btn btn-sm btn-outline-danger ms-1">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal for viewing recordings -->
    <div v-if="selectedRecording" class="modal-backdrop" @click="closeModal"></div>
    <div v-if="selectedRecording" class="recording-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ formatDateTime(selectedRecording.timestamp) }}</h5>
          <button @click="closeModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <img v-if="selectedRecording.type === 'image'" :src="selectedRecording.url" class="img-fluid">
          <video v-else controls class="w-100">
            <source :src="selectedRecording.url" type="video/webm">
            Your browser does not support the video tag.
          </video>
        </div>
        <div class="modal-footer">
          <button @click="downloadRecording(selectedRecording)" class="btn btn-primary">Download</button>
          <button @click="closeModal" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistoryView',
  data() {
    return {
      loading: true,
      recordings: [],
      filteredRecordings: [],
      selectedRecording: null,
      viewMode: 'grid',
      filters: {
        date: '',
        type: 'all',
        camera: 'all'
      },
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      weekDays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      // Mock data for demonstration
      recordingDays: [1, 5, 10, 15, 20, 25]
    };
  },
  computed: {
    currentMonthName() {
      return new Date(this.currentYear, this.currentMonth, 1).toLocaleString('default', { month: 'long' });
    },
    calendarDays() {
      const days = [];
      const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
      const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
      
      // Add empty cells for days before the first day of month
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      
      return days;
    }
  },
  mounted() {
    this.loadRecordings();
    
    // Set default date to today
    const today = new Date();
    this.filters.date = today.toISOString().split('T')[0];
  },
  methods: {
    loadRecordings() {
      this.loading = true;
      
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock data for demonstration
        this.recordings = [
          {
            id: 1,
            type: 'video',
            timestamp: new Date().getTime(),
            camera: 'Camera 1',
            duration: 65, // seconds
            url: '#',
            thumbnail: 'https://via.placeholder.com/320x180?text=Video+1'
          },
          {
            id: 2,
            type: 'image',
            timestamp: new Date().getTime() - 3600000, // 1 hour ago
            camera: 'Camera 1',
            url: 'https://via.placeholder.com/1280x720?text=Image+1',
            thumbnail: 'https://via.placeholder.com/320x180?text=Image+1'
          },
          {
            id: 3,
            type: 'video',
            timestamp: new Date().getTime() - 7200000, // 2 hours ago
            camera: 'Camera 2',
            duration: 120, // seconds
            url: '#',
            thumbnail: 'https://via.placeholder.com/320x180?text=Video+2'
          },
          {
            id: 4,
            type: 'image',
            timestamp: new Date().getTime() - 86400000, // 1 day ago
            camera: 'Camera 2',
            url: 'https://via.placeholder.com/1280x720?text=Image+2',
            thumbnail: 'https://via.placeholder.com/320x180?text=Image+2'
          }
        ];
        
        this.applyFilters();
        this.loading = false;
      }, 1000);
    },
    
    applyFilters() {
      this.filteredRecordings = this.recordings.filter(recording => {
        // Filter by date
        if (this.filters.date) {
          const recordingDate = new Date(recording.timestamp).toISOString().split('T')[0];
          if (recordingDate !== this.filters.date) {
            return false;
          }
        }
        
        // Filter by type
        if (this.filters.type !== 'all' && recording.type !== this.filters.type) {
          return false;
        }
        
        // Filter by camera
        if (this.filters.camera !== 'all' && recording.camera !== this.filters.camera) {
          return false;
        }
        
        return true;
      });
    },
    
    selectRecording(recording) {
      this.selectedRecording = recording;
    },
    
    closeModal() {
      this.selectedRecording = null;
    },
    
    downloadRecording(recording) {
      // In a real application, this would trigger a download
      alert(`Downloading ${recording.type}: ${this.formatDateTime(recording.timestamp)}`);
    },
    
    deleteRecording(recording) {
      if (confirm(`Are you sure you want to delete this ${recording.type}?`)) {
        // In a real application, this would call an API to delete the recording
        this.recordings = this.recordings.filter(r => r.id !== recording.id);
        this.applyFilters();
        
        if (this.selectedRecording && this.selectedRecording.id === recording.id) {
          this.closeModal();
        }
      }
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    formatDateTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
    },
    
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
    },
    
    selectDay(day) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.filters.date = date.toISOString().split('T')[0];
      this.applyFilters();
    },
    
    hasRecordingsOnDay(day) {
      // Mock implementation - in a real app, this would check if there are recordings on this day
      return this.recordingDays.includes(day);
    },
    
    isCurrentDay(day) {
      const today = new Date();
      return day === today.getDate() && 
             this.currentMonth === today.getMonth() && 
             this.currentYear === today.getFullYear();
    }
  }
};
</script>

<style scoped>
.recordings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.recording-card {
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  overflow: hidden;
  transition: transform 0.2s;
}

.recording-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.recording-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  cursor: pointer;
  background-color: #000;
}

.recording-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumbnail .play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  color: white;
  opacity: 0.8;
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.duration-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.8rem;
}

.recording-info {
  padding: 0.5rem;
}

.recording-time {
  font-weight: bold;
}

.recording-camera {
  font-size: 0.8rem;
  color: #6c757d;
}

.recording-actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

/* Calendar styles */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day-header {
  text-align: center;
  font-weight: bold;
  padding: 5px 0;
}

.calendar-day {
  text-align: center;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 4px;
}

.calendar-day:hover:not(.empty) {
  background-color: #f8f9fa;
}

.calendar-day.empty {
  background-color: transparent;
  cursor: default;
}

.calendar-day.has-recordings {
  background-color: #e2f0ff;
  font-weight: bold;
}

.calendar-day.current-day {
  background-color: #007bff;
  color: white;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  z-index: 1000;
}

.recording-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 80%;
  max-width: 800px;
}

.modal-content {
  background-color: white;
  border-radius: 0.3rem;
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-body {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>