// app/api/logs/stream/route.ts
import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const customReadable = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            source: 'system',
            timestamp: new Date().toISOString(),
            message: 'Connected to log stream'
          })}\n\n`
        )
      );

      try {
        // Set up the docker logs tail process
        const mobsfLogs = spawn('docker', ['logs', '-f', 'mobsf']);
        const scanLogs = spawn('tail', ['-f', '/home/pron/mobsf/mobsf_scans.log']);

        // Handle Docker logs errors
        mobsfLogs.stderr.on('data', (data) => {
          console.error('Docker logs error:', data.toString());
        });

        mobsfLogs.on('error', (error) => {
          console.error('Failed to spawn docker logs process:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                source: 'system',
                timestamp: new Date().toISOString(),
                message: 'Error accessing Docker logs: ' + error.message
              })}\n\n`
            )
          );
        });

        // Handle scan logs errors
        scanLogs.stderr.on('data', (data) => {
          console.error('Scan logs error:', data.toString());
        });

        scanLogs.on('error', (error) => {
          console.error('Failed to spawn tail process:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                source: 'system',
                timestamp: new Date().toISOString(),
                message: 'Error accessing scan logs: ' + error.message
              })}\n\n`
            )
          );
        });

        // Stream Docker logs
        mobsfLogs.stdout.on('data', (data) => {
          const message = {
            source: 'mobsf-docker',
            timestamp: new Date().toISOString(),
            message: data.toString().trim()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        });

        // Stream scan logs
        scanLogs.stdout.on('data', (data) => {
          const message = {
            source: 'scan-script',
            timestamp: new Date().toISOString(),
            message: data.toString().trim()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        });

        // Handle cleanup
        request.signal.addEventListener('abort', () => {
          console.log('Client disconnected, cleaning up processes');
          mobsfLogs.kill();
          scanLogs.kill();
          controller.close();
        });

      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}