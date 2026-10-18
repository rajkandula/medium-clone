import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generatePresignedUrl, checkUpload, userFolder } from '@/lib/upload';

// POST /api/upload/presign — a one-hour upload URL for one image. The type and
// size are checked here and the size is signed into the URL; the key always
// sits under a known folder and the caller's own user id.
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, contentType, folder, size } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 });
    }
    const refused = checkUpload(contentType, Number(size));
    if (refused) return NextResponse.json({ error: refused.error }, { status: refused.status });

    const result = await generatePresignedUrl(filename, contentType, userFolder(folder, session.userId), Number(size));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
