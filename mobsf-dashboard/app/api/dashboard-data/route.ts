import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET() {
  const db = await openDb();

  try {
    const data = await db.all(`
      SELECT 
        b.id as batchId,
        b.batch_date as batchDate,
        SUM(s.high_findings) as highRisk,
        SUM(s.warning_findings) as mediumRisk,
        SUM(s.info_findings) as lowRisk,
        AVG(s.security_score) as avgScore,
        SUM(CASE WHEN s.platform = 'Android' THEN s.high_findings ELSE 0 END) as androidHighRisk,
        SUM(CASE WHEN s.platform = 'iOS' THEN s.high_findings ELSE 0 END) as iosHighRisk
      FROM batches b
      JOIN scans s ON b.id = s.batch_id
      GROUP BY b.id
      ORDER BY b.created_at
    `);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Error fetching dashboard data' }, { status: 500 });
  } finally {
    await db.close();
  }
}