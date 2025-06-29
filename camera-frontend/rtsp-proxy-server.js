import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 12001;
const FFMPEG_PATH = 'ffmpeg'; // Ensure ffmpeg is installed on your system

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(join(__dirname, 'dist')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store active streams
const activeStreams = new Map();

// API endpoint to start streaming
app.post('/api/stream', (req, res) => {
  const { rtspUrl, streamId } = req.body;
  
  if (!rtspUrl || !streamId) {
    return res.status(400).json({ error: 'RTSP URL and Stream ID are required' });
  }
  
  // Stop existing stream if any
  if (activeStreams.has(streamId)) {
    const stream = activeStreams.get(streamId);
    if (stream.ffmpeg) {
      stream.ffmpeg.kill('SIGKILL');
    }
    activeStreams.delete(streamId);
  }
  
  console.log(`Starting stream for ${streamId} with URL: ${rtspUrl}`);
  
  // Store stream info
  activeStreams.set(streamId, {
    rtspUrl,
    clients: new Set(),
    ffmpeg: null
  });
  
  res.json({ success: true, streamId });
});

// API endpoint to stop streaming
app.post('/api/stop', (req, res) => {
  const { streamId } = req.body;
  
  if (!streamId) {
    return res.status(400).json({ error: 'Stream ID is required' });
  }
  
  if (activeStreams.has(streamId)) {
    const stream = activeStreams.get(streamId);
    if (stream.ffmpeg) {
      stream.ffmpeg.kill('SIGKILL');
    }
    activeStreams.delete(streamId);
    console.log(`Stopped stream: ${streamId}`);
  }
  
  res.json({ success: true });
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  // Extract stream ID from URL
  const url = new URL(req.url, 'http://localhost');
  const streamId = url.searchParams.get('streamId');
  
  if (!streamId || !activeStreams.has(streamId)) {
    console.log(`Invalid stream ID: ${streamId}`);
    ws.close();
    return;
  }
  
  const stream = activeStreams.get(streamId);
  stream.clients.add(ws);
  
  console.log(`Client connected to stream: ${streamId}, total clients: ${stream.clients.size}`);
  
  // Start FFmpeg if this is the first client
  if (stream.clients.size === 1) {
    startFFmpeg(streamId, stream.rtspUrl);
  }
  
  // Handle client disconnect
  ws.on('close', () => {
    if (activeStreams.has(streamId)) {
      const stream = activeStreams.get(streamId);
      stream.clients.delete(ws);
      console.log(`Client disconnected from stream: ${streamId}, remaining clients: ${stream.clients.size}`);
      
      // Stop FFmpeg if no clients are left
      if (stream.clients.size === 0) {
        if (stream.ffmpeg) {
          stream.ffmpeg.kill('SIGKILL');
          stream.ffmpeg = null;
        }
      }
    }
  });
});

// Function to start FFmpeg process
function startFFmpeg(streamId, rtspUrl) {
  if (!activeStreams.has(streamId)) return;
  
  const stream = activeStreams.get(streamId);
  
  // FFmpeg command to convert RTSP to MPEG1 video for jsmpeg
  const ffmpeg = spawn(FFMPEG_PATH, [
    '-i', rtspUrl,
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-s', '640x480',
    '-b:v', '1000k',
    '-r', '25',
    '-bf', '0',
    '-codec:a', 'mp2',
    '-ar', '44100',
    '-ac', '1',
    '-b:a', '128k',
    '-muxdelay', '0.001',
    '-'
  ]);
  
  console.log(`FFmpeg started for stream: ${streamId}`);
  
  stream.ffmpeg = ffmpeg;
  
  // Handle FFmpeg output
  ffmpeg.stdout.on('data', (data) => {
    // Broadcast to all connected clients
    stream.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  });
  
  // Handle FFmpeg errors
  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg stderr: ${data}`);
  });
  
  // Handle FFmpeg exit
  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code} for stream: ${streamId}`);
    if (activeStreams.has(streamId)) {
      activeStreams.get(streamId).ffmpeg = null;
    }
  });
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`RTSP Proxy Server running at http://localhost:${PORT}`);
});