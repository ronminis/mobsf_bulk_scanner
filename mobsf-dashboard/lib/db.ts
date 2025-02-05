import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function openDb() {
  const dbPath = path.resolve(process.cwd(), '..','mobsf_scans.db');
  console.log('Attempting to open database at:', dbPath);
  
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}