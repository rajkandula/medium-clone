import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generatePresignedUrl } from '@/lib/upload';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, contentType, folder } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 });
    }

    const result = await generatePresignedUrl(filename, contentType, folder || 'uploads');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
