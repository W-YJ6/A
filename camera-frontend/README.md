# Camera Streaming Frontend System

A modern web-based frontend system for connecting to cameras, displaying real-time video streams, and managing recorded videos and snapshots.

## Features

- **Live Camera View**: Connect to and display real-time video from webcams or IP cameras
- **Camera Controls**: Start/stop streaming, take snapshots, and record video
- **Multi-Camera Support**: Connect to and switch between multiple cameras
- **Video History**: Browse, view, and manage recorded videos and snapshots
- **Calendar View**: Easily find recordings by date
- **Configurable Settings**: Customize camera, recording, and storage settings

## Technology Stack

- **Vue.js 3**: Frontend framework
- **Vue Router**: For navigation between different views
- **Vite**: Build tool and development server
- **WebRTC**: For accessing camera streams
- **MediaRecorder API**: For recording video from camera streams

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:12000

### Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Live View

1. Select a camera from the dropdown menu
2. Click the "Start" button to begin streaming
3. Use the controls to take snapshots or record video
4. Adjust resolution as needed

### History View

1. Use the calendar or filters to find recordings
2. Click on a recording to view it
3. Download or delete recordings as needed

### Settings

Configure various aspects of the system:
- Camera settings (resolution, frame rate)
- Recording settings (format, quality)
- Storage management
- Advanced settings (RTSP URLs for IP cameras, motion detection)

## Browser Compatibility

This application works best in modern browsers that support the MediaDevices API:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## License

ISC