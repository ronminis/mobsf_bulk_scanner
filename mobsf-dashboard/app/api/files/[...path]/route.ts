// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), 'mobsf_reports', ...params.path);
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (filePath.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
