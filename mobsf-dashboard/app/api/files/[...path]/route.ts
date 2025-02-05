import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { decode } from 'url';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const decodedPath = params.path.map(p => decode(p));
    const filePath = path.join('/home/pron/mobsf', 'mobsf_reports', ...decodedPath);
    const fileBuffer = await fs.readFile(filePath);

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