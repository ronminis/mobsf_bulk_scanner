import { openDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { bundleId: string } }
) {
  const bundleId = params.bundleId;
  const batchId = request.nextUrl.searchParams.get('batchId');

  try {
    const db = await openDb();
    
    // Get current batch scan details
    const currentScan = await db.get(`
      SELECT 
        s.*,
        b.batch_date
      FROM scans s
      JOIN batches b ON s.batch_id = b.id
      WHERE s.bundle_id = ? AND s.batch_id = ?
    `, [bundleId, batchId]);

    // Get historical data for trends
    const history = await db.all(`
      SELECT 
        s.security_score,
        s.high_findings,
        s.warning_findings,
        s.info_findings,
        b.batch_date
      FROM scans s
      JOIN batches b ON s.batch_id = b.id
      WHERE s.bundle_id = ?
      ORDER BY b.batch_date ASC
    `, [bundleId]);

    await db.close();

    if (!currentScan) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({
      currentScan,
      history
    });
  } catch (error) {
    console.error('Error in GET /api/apps/[bundleId]:', error);
    return NextResponse.json({ error: 'Failed to fetch app data' }, { status: 500 });
  }
}