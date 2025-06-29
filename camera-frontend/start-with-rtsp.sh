#!/bin/bash

# 检查是否安装了ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg is required but not installed. Installing FFmpeg..."
    apt-get update && apt-get install -y ffmpeg
fi

# 启动RTSP代理服务器
echo "Starting RTSP proxy server on port 12001..."
PORT=12001 node rtsp-proxy-server.js &
RTSP_PID=$!

# 等待RTSP服务器启动
sleep 2

# 启动前端应用
echo "Starting frontend application on port 12000..."
PORT=12000 npm run dev

# 当前端应用停止时，也停止RTSP代理服务器
kill $RTSP_PID