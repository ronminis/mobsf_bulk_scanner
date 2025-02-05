#!/usr/bin/env python3
# log_aggregator.py

import asyncio
import json
import sys
import asyncio
import websockets
import docker
from datetime import datetime

async def docker_logs_stream(container_name, websocket):
    try:
        client = docker.from_env()
        container = client.containers.get(container_name)
        
        for line in container.logs(stream=True, follow=True, tail=100):
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_entry = {
                "source": "mobsf-docker",
                "timestamp": timestamp,
                "message": line.decode().strip()
            }
            await websocket.send(json.dumps(log_entry))
    except docker.errors.NotFound:
        print(f"Container {container_name} not found")
    except Exception as e:
        print(f"Error streaming docker logs: {e}")

async def scan_logs_stream(log_file, websocket):
    try:
        process = await asyncio.create_subprocess_exec(
            'tail', '-f', log_file,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        while True:
            line = await process.stdout.readline()
            if not line:
                break
                
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_entry = {
                "source": "scan-script",
                "timestamp": timestamp,
                "message": line.decode().strip()
            }
            await websocket.send(json.dumps(log_entry))
    except Exception as e:
        print(f"Error streaming scan logs: {e}")

async def start_server(websocket, path):
    tasks = [
        asyncio.create_task(docker_logs_stream('mobsf', websocket)),
        asyncio.create_task(scan_logs_stream('/home/pron/mobsf/mobsf_scans.log', websocket))
    ]
    
    try:
        await asyncio.gather(*tasks)
    except websockets.exceptions.ConnectionClosed:
        for task in tasks:
            task.cancel()

if __name__ == "__main__":
    start_server = websockets.serve(start_server, "localhost", 8765)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
