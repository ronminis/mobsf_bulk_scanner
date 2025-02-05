// app/api/trigger-scan/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const JENKINS_URL = process.env.JENKINS_URL || 'http://localhost:8080';
    const JENKINS_USER = process.env.JENKINS_USER;
    const JENKINS_TOKEN = process.env.JENKINS_API_TOKEN;

    if (!JENKINS_TOKEN || !JENKINS_USER) {
      console.error('Jenkins credentials not configured');
      return NextResponse.json(
        { error: 'Jenkins credentials not configured' },
        { status: 500 }
      );
    }

    // Base64 encode credentials
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString('base64');
    
    console.log('Attempting to trigger Jenkins job...');
    
    const response = await fetch(`${JENKINS_URL}/job/mobsf-scan-test/buildWithParameters?token=START_SCAN&SCAN_TYPE=manual`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    console.log('Jenkins response status:', response.status);
    
    const responseText = await response.text();
    console.log('Jenkins response body:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Jenkins responded with status: ${response.status}`,
          details: responseText
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Scan job triggered successfully'
    });
    
  } catch (error) {
    console.error('Failed to trigger scan:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}