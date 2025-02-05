import { openDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const db = await openDb();
    
    // Get unique apps with their latest scan info and icon paths
    const apps = await db.all(`
      WITH RankedScans AS (
        SELECT 
          s.*,
          b.batch_date,
          ROW_NUMBER() OVER (
            PARTITION BY s.bundle_id 
            ORDER BY b.batch_date DESC, s.id DESC
          ) as rn
        FROM scans s
        JOIN batches b ON s.batch_id = b.id
      )
      SELECT 
        app_name,
        bundle_id,
        platform,
        security_score,
        high_findings,
        warning_findings,
        info_findings,
        batch_id,
        batch_date,
        icon_path
      FROM RankedScans
      WHERE rn = 1
      ORDER BY app_name ASC
    `);

    await db.close();

    if (!apps) {
      return NextResponse.json({ error: 'No apps found' }, { status: 404 });
    }

    return NextResponse.json(apps);
  } catch (error) {
    console.error('Error in GET /api/apps/inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app inventory' }, 
      { status: 500 }
    );
  }
}