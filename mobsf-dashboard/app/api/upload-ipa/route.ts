import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = '/home/pron/mobsf/manual_ipa_uploads';

export const config = {
  api: {
    bodyParser: false
  }
}

export async function POST(request: NextRequest) {
  console.log('Received upload request');
  
  try {
    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });
    
    // Parse the multipart form data
    const formData = await request.formData();
    console.log('FormData received');
    
    // Get the file from the form data - use 'file' as the field name
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.error('No file received in form data');
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Log file details
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.ipa')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only IPA files are allowed.'
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFilename = `${timestamp}_${file.name}`;
    const filepath = join(UPLOAD_DIR, uniqueFilename);

    // Convert file to buffer and save
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    
    console.log('File saved successfully:', uniqueFilename);

    return NextResponse.json({
      success: true,
      filename: uniqueFilename
    }, { status: 200 });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}