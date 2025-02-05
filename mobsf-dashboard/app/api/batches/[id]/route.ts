// app/api/batches/[id]/route.ts
import { openDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await context.params;
    const db = await openDb();

    // Get current batch
    const currentBatch = await db.get('SELECT * FROM batches WHERE id = ?', [batchId]);

    if (!currentBatch) {
      await db.close();
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get scans for the current batch
    const scans = await db.all('SELECT * FROM scans WHERE batch_id = ?', [batchId]);

    // Process the scans data
    const processedData = {
      current: {
        android: { apps: [], totalApps: 0, avgScore: 0, highRiskApps: 0 },
        ios: { apps: [], totalApps: 0, avgScore: 0, highRiskApps: 0 }
      }
    };

    scans.forEach(scan => {
      const platform = scan.platform.toLowerCase();
      if (platform === 'android' || platform === 'ios') {
        processedData.current[platform].apps.push({
          name: scan.app_name,
          bundleId: scan.bundle_id,
          icon: scan.icon_path,
          securityScore: scan.security_score,
          highRiskFindings: scan.high_findings,
          reportUrl: scan.pdf_path
        });
        processedData.current[platform].totalApps++;
        processedData.current[platform].avgScore += scan.security_score;
        if (scan.high_findings > 0) {
          processedData.current[platform].highRiskApps++;
        }
      }
    });

    // Calculate average scores
    if (processedData.current.android.totalApps > 0) {
      processedData.current.android.avgScore /= processedData.current.android.totalApps;
    }
    if (processedData.current.ios.totalApps > 0) {
      processedData.current.ios.avgScore /= processedData.current.ios.totalApps;
    }

    await db.close();
    return NextResponse.json(processedData);
    
  } catch (error) {
    console.error('Error in GET /api/batches/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch batch data' }, { status: 500 });
  }
}