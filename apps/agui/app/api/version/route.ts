import { NextResponse } from 'next/server';
import { VERSION_INFO } from '@/lib/version';

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

/**
 * GET /api/version
 * Returns application version information
 *
 * Example response:
 * {
 *   "version": "1.5.1",
 *   "commit": "12e4db7...",
 *   "commitShort": "12e4db7",
 *   "buildDate": "2025-10-20T03:15:00.000Z",
 *   "branch": "main"
 * }
 */
export async function GET() {
  return NextResponse.json(VERSION_INFO, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
