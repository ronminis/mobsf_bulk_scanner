#!/usr/bin/env python3
# log_aggregator.py

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import asyncio
import docker
from datetime import datetime
import subprocess
from threading import Thread
import signal
import sys

class LogStreamer:
    def __init__(self, response):
        self.response = response
        self.running = True
        self.docker_client = docker.from_env()

    def send_event(self, data):
        try:
            message = f"data: {json.dumps(data)}\n\n"
            self.response.wfile.write(message.encode('utf-8'))
            self.response.wfile.flush()
        except Exception as e:
            print(f"Error sending event: {e}")
            self.running = False

    def stream_docker_logs(self):
        try:
            container = self.docker_client.containers.get('mobsf')
            for line in container.logs(stream=True, follow=True, tail=100):
                if not self.running:
                    break
                self.send_event({
                    "source": "mobsf-docker",
                    "timestamp": datetime.now().isoformat(),
                    "message": line.decode().strip()
                })
        except docker.errors.NotFound:
            print("MobSF container not found")
        except Exception as e:
            print(f"Error streaming docker logs: {e}")

    def stream_scan_logs(self):
        try:
            process = subprocess.Popen(
                ['tail', '-f', '/home/pron/mobsf/mobsf_scans.log'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            while self.running:
                line = process.stdout.readline()
                if not line:
                    break
                self.send_event({
                    "source": "scan-script",
                    "timestamp": datetime.now().isoformat(),
                    "message": line.strip()
                })
                
            process.terminate()
            process.wait()
            
        except Exception as e:
            print(f"Error streaming scan logs: {e}")

    def start(self):
        # Send initial connection message
        self.send_event({
            "source": "system",
            "timestamp": datetime.now().isoformat(),
            "message": "Connected to log stream"
        })

        # Start both streams in separate threads
        docker_thread = Thread(target=self.stream_docker_logs)
        scan_thread = Thread(target=self.stream_scan_logs)
        
        docker_thread.start()
        scan_thread.start()
        
        while self.running:
            try:
                docker_thread.join(0.1)
                scan_thread.join(0.1)
            except KeyboardInterrupt:
                self.running = False
                break

class LogHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/logs':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            streamer = LogStreamer(self)
            streamer.start()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

def run_server(port=3001):
    server = HTTPServer(('localhost', port), LogHandler)
    print(f"Starting log aggregator server on port {port}")
    
    def signal_handler(sig, frame):
        print("\nShutting down server...")
        server.server_close()
        sys.exit(0):
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    run_server()