import { openDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await openDb();
    const batches = await db.all('SELECT * FROM batches ORDER BY id DESC');
    await db.close();
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error in GET /api/batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}